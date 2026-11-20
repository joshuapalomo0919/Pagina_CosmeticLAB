import type { RegisteredUser, RolUsuario } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';
import { leerTabla, escribirTabla } from '../almacen';

const repositorioUsuarios = crearRepositorio<RegisteredUser, 'id'>(
  'Usuario',
  'id',
  { camposUnicos: ['email'] },
);

const repositorioRoles = crearRepositorio<RolUsuario, 'id_rol_usuario'>(
  'RolUsuario',
  'id_rol_usuario',
  {
    clavesForaneas: [
      { campo: 'id_rol', tabla: 'Rol', campoReferenciado: 'id_rol' },
      { campo: 'id_usuario', tabla: 'Usuario', campoReferenciado: 'id' },
    ],
  },
);

export const listarUsuarios = async (): Promise<RegisteredUser[]> => repositorioUsuarios.listar();

export const obtenerUsuario = async (id: number): Promise<RegisteredUser | undefined> => (
  repositorioUsuarios.obtener(id)
);

export const crearUsuario = async (
  datos: Omit<RegisteredUser, 'id'>,
): Promise<RegisteredUser> => repositorioUsuarios.crear(datos);

export const actualizarUsuario = async (
  id: number,
  cambios: Partial<Omit<RegisteredUser, 'id'>>,
): Promise<RegisteredUser> => repositorioUsuarios.actualizar(id, cambios);

export const obtenerRolesUsuario = async (idUsuario: number): Promise<number[]> => {
  const roles = (await repositorioRoles.listar())
    .filter((relacion) => relacion.id_usuario === idUsuario)
    .map((relacion) => relacion.id_rol);
  return roles.length > 0 ? roles : [2];
};

export const asignarRolUsuario = async (idUsuario: number, idRol: number): Promise<void> => {
  const relaciones = await repositorioRoles.listar();
  if (relaciones.some((relacion) => relacion.id_usuario === idUsuario && relacion.id_rol === idRol)) {
    return;
  }
  await repositorioRoles.crear({ id_usuario: idUsuario, id_rol: idRol });
};

export const quitarRolUsuario = async (idUsuario: number, idRol: number): Promise<void> => {
  const relaciones = await repositorioRoles.listar();
  const relacion = relaciones.find((fila) => fila.id_usuario === idUsuario && fila.id_rol === idRol);
  if (relacion) {
    await repositorioRoles.eliminar(relacion.id_rol_usuario);
  }
};

export const eliminarUsuario = async (idUsuario: number): Promise<void> => {
  const tablasConReferencias = [
    { tabla: 'Pedido', campo: 'id_usuario' },
    { tabla: 'Cita', campo: 'id_usuario' },
    { tabla: 'Carrito', campo: 'id_usuario' },
  ];

  for (const referencia of tablasConReferencias) {
    const registros = leerTabla<Record<string, unknown>>(referencia.tabla);
    if (registros.some((registro) => registro[referencia.campo] === idUsuario)) {
      throw new Error(`No se puede eliminar el usuario: tiene registros relacionados en ${referencia.tabla}.`);
    }
  }

  const relaciones = (await repositorioRoles.listar())
    .filter((relacion) => relacion.id_usuario !== idUsuario);
  escribirTabla('RolUsuario', relaciones);
  await repositorioUsuarios.eliminar(idUsuario);
};
