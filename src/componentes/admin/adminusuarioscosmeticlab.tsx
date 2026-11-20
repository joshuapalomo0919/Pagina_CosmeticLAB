import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { RegisteredUser } from '../../types/modelos';
import { useCosmetic } from '../../context/cosmeticlab';
import {
  asignarRolUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerRolesUsuario,
  quitarRolUsuario,
} from '../../data/repositorios/usuariorepo';

interface UsuarioConRoles {
  usuario: RegisteredUser;
  roles: number[];
}

const reportarErrorCarga = (
  error: unknown,
  english: boolean,
  setError: Dispatch<SetStateAction<string>>,
): void => {
  console.error('No se pudieron cargar los usuarios del panel.', error);
  setError(english ? 'Unable to load users.' : 'No se pudieron cargar los usuarios.');
};

const AdminUsuariosCosmeticLab = () => {
  const { language } = useCosmetic();
  const english = language === 'en';
  const [filas, setFilas] = useState<UsuarioConRoles[]>([]);
  const [error, setError] = useState('');

  const obtenerUsuarios = useCallback(async (): Promise<UsuarioConRoles[]> => {
    const usuarios = await listarUsuarios();
    return Promise.all(usuarios.map(async (usuario) => ({
      usuario,
      roles: await obtenerRolesUsuario(usuario.id),
    })));
  }, []);

  useEffect(() => {
    void obtenerUsuarios()
      .then(setFilas)
      .catch((loadError: unknown) => reportarErrorCarga(loadError, english, setError));
  }, [obtenerUsuarios, english]);

  const cargarUsuarios = async () => {
    setFilas(await obtenerUsuarios());
  };

  const cambiarRol = async (fila: UsuarioConRoles, idRol: number) => {
    setError('');
    try {
      if (fila.roles.includes(idRol)) {
        await quitarRolUsuario(fila.usuario.id, idRol);
      } else {
        await asignarRolUsuario(fila.usuario.id, idRol);
      }
      await cargarUsuarios();
    } catch (roleError) {
      console.error('No se pudo actualizar el rol del usuario.', roleError);
      setError(english ? 'Unable to update this user role.' : 'No se pudo actualizar el rol del usuario.');
    }
  };

  const borrarUsuario = async (usuario: RegisteredUser) => {
    setError('');
    try {
      await eliminarUsuario(usuario.id);
      await cargarUsuarios();
    } catch (deleteError) {
      console.error('No se pudo eliminar el usuario.', deleteError);
      setError(deleteError instanceof Error
        ? deleteError.message
        : (english ? 'Unable to delete this user.' : 'No se pudo eliminar el usuario.'));
    }
  };

  return (
    <div>
      <h2>{english ? 'Users' : 'Usuarios'}</h2>
      {error && <p className="error-message" role="alert">{error}</p>}
      {filas.length === 0 ? (
        <p>{english ? 'No users found.' : 'No hay usuarios registrados.'}</p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>{english ? 'Name' : 'Nombre'}</th>
                <th>{english ? 'Email' : 'Correo'}</th>
                <th>{english ? 'Document' : 'Documento'}</th>
                <th>{english ? 'Roles' : 'Roles'}</th>
                <th>{english ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ usuario, roles }) => (
                <tr key={usuario.id}>
                  <td>{usuario.firstName} {usuario.lastName}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.documentNumber}</td>
                  <td className="role-actions">
                    {[1, 2].map((idRol) => (
                      <button
                        type="button"
                        key={idRol}
                        aria-pressed={roles.includes(idRol)}
                        onClick={() => void cambiarRol({ usuario, roles }, idRol)}
                      >
                        {idRol === 1
                          ? (english ? 'Administrator' : 'Administrador')
                          : (english ? 'User' : 'Usuario')}
                        {roles.includes(idRol) ? ' ✓' : ' +'}
                      </button>
                    ))}
                  </td>
                  <td>
                    <button className="panel-delete" type="button" onClick={() => void borrarUsuario(usuario)}>
                      {english ? 'Delete' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsuariosCosmeticLab;
