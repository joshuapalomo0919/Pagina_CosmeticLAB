import { existeTabla, escribirTabla, leerTabla, migrar } from './almacen';
import type { RegisteredUser, Rol } from '../types/modelos';
import { asignarRolUsuario, crearUsuario, listarUsuarios } from './repositorios/usuariorepo';

const ORDEN_TABLAS = [
  'Rol',
  'Usuario',
  'Categoria',
  'Marca',
  'Proveedor',
  'Servicio',
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
  'Horario',
  'Cita',
  'DetalleCita',
]);

const semillas = import.meta.glob<unknown[]>('./semillas/*.json', {
  eager: true,
  import: 'default',
});

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
