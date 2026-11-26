import { existeTabla, escribirTabla, leerTabla, migrar } from './almacen';
import type { RegisteredUser, Rol, Servicio } from '../types/modelos';
import { asignarRolUsuario, crearUsuario, listarUsuarios } from './repositorios/usuariorepo';

const ORDEN_TABLAS = [
  'Rol',
  'Usuario',
  'Categoria',
  'Marca',
  'Proveedor',
  'Servicio',
  'Maquilladora',
  'Horario',
  'Producto',
  'DetalleProducto',
  'ProductoProveedor',
  'RolUsuario',
  'Carrito',
  'Pedido',
  'Cita',
  'DetalleCarrito',
  'DetallePedido',
  'DetalleCita',
  'Entregas',
  'Notificaciones',
  'pqr',
] as const;

const TABLAS_SEMILLABLES = new Set([
  'Categoria',
  'Marca',
  'Producto',
  'DetalleProducto',
  'Servicio',
  'Maquilladora',
  'Horario',
  'Cita',
  'DetalleCita',
]);

// TODO(confirmar): los precios, duraciones y horarios son datos demostrativos; validar con el negocio.
// TODO(confirmar): Horario no incluye id_servicio, por lo que la disponibilidad se comparte entre servicios.
const semillas = import.meta.glob<unknown[]>('./semillas/*.json', {
  eager: true,
  import: 'default',
});

const esServicio = (fila: unknown): fila is Servicio => {
  if (typeof fila !== 'object' || fila === null) return false;
  return 'id_servicio' in fila
    && typeof fila.id_servicio === 'number'
    && 'nombre' in fila
    && typeof fila.nombre === 'string'
    && 'descripcion' in fila
    && typeof fila.descripcion === 'string'
    && 'precio' in fila
    && typeof fila.precio === 'number'
    && 'imagen' in fila
    && typeof fila.imagen === 'string'
    && 'duracion' in fila
    && typeof fila.duracion === 'string'
    && 'estado' in fila
    && (fila.estado === 'Activo' || fila.estado === 'Inactivo');
};

export const cargarSemillas = async (): Promise<void> => {
  migrar();

  for (const tabla of ORDEN_TABLAS) {
    const filas = semillas[`./semillas/${tabla}.json`] ?? [];
    if (!Array.isArray(filas)) {
      throw new Error(`La semilla de ${tabla} no contiene una lista de registros.`);
    }
    if (existeTabla(tabla)) {
      if (TABLAS_SEMILLABLES.has(tabla) && leerTabla<unknown>(tabla).length === 0 && filas.length > 0) {
        escribirTabla(tabla, filas);
      } else if (tabla === 'Servicio') {
        const serviciosActuales = leerTabla<Servicio>('Servicio');
        const serviciosSemilla = filas.filter(esServicio);
        const serviciosActualizados = serviciosActuales.map((servicio) => {
          const servicioSemilla = serviciosSemilla.find(
            (fila) => fila.id_servicio === servicio.id_servicio,
          );
          const esPlantillaSinConfigurar = servicio.estado === 'Inactivo'
            && servicio.precio === 0
            && !servicio.imagen
            && !servicio.duracion;
          if (!servicioSemilla || !esPlantillaSinConfigurar) return servicio;
          return {
            ...servicio,
            estado: servicioSemilla.estado,
            precio: servicioSemilla.precio,
            imagen: servicioSemilla.imagen,
            duracion: servicioSemilla.duracion,
          };
        });
        if (serviciosActualizados.some((servicio, index) => servicio !== serviciosActuales[index])) {
          escribirTabla(tabla, serviciosActualizados);
        }
      }
      continue;
    }

    escribirTabla(tabla, filas);
  }

  await asegurarRolesBase();
  await asegurarAdministrador();
};

const asegurarRolesBase = async (): Promise<void> => {
  const roles = leerTabla<Rol>('Rol');
  const rolesBase: Rol[] = [
    { id_rol: 1, nombre: 'Administrador', descripcion: 'Administración de CosmeticLAB' },
    { id_rol: 2, nombre: 'Usuario', descripcion: 'Cliente de CosmeticLAB' },
  ];
  const existentes = new Set(roles.map((rol) => rol.id_rol));
  const nuevasFilas = [...roles, ...rolesBase.filter((rol) => !existentes.has(rol.id_rol))];
  if (nuevasFilas.length !== roles.length) {
    escribirTabla('Rol', nuevasFilas);
  }
};

const asegurarAdministrador = async (): Promise<void> => {
  let administrador = (await listarUsuarios()).find(
    (usuario) => usuario.email.toLocaleLowerCase() === 'admin@cosmeticlab.com',
  );
  if (!administrador) {
    const datos: Omit<RegisteredUser, 'id'> = {
      firstName: 'Administrador',
      lastName: 'CosmeticLAB',
      documentType: 'No aplica',
      documentNumber: 'ADMIN-COSMETICLAB',
      birthDate: '',
      email: 'admin@cosmeticlab.com',
      phone: '',
      country: '',
      city: '',
      password: 'Admin123*', // TODO(backend): reemplazar por autenticación con hash.
    };
    administrador = await crearUsuario(datos);
  }
  await asignarRolUsuario(administrador.id, 1);
  await asignarRolUsuario(administrador.id, 2);
};
