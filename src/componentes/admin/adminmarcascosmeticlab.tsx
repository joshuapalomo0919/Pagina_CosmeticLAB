import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCosmetic } from '../../context/cosmeticlab';
import {
  actualizarMarca,
  cambiarEstadoMarca,
  crearMarca,
  listarMarcas,
} from '../../data/repositorios/marcarepo';
import type { Marca } from '../../types/modelos';

const formularioVacio = { nombre: '', descripcion: '', logo: '', estado: 'Activo' as Marca['estado'] };

const reportarErrorCarga = (
  error: unknown,
  english: boolean,
  setError: Dispatch<SetStateAction<string>>,
): void => {
  console.error('No se pudieron cargar las marcas.', error);
  setError(english ? 'Unable to load brands.' : 'No se pudieron cargar las marcas.');
};

const AdminMarcasCosmeticLab = () => {
  const { language } = useCosmetic();
  const english = language === 'en';
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const obtenerMarcas = useCallback(async () => listarMarcas(), []);

  useEffect(() => {
    void obtenerMarcas()
      .then(setMarcas)
      .catch((loadError: unknown) => reportarErrorCarga(loadError, english, setError));
  }, [obtenerMarcas, english]);

  const cargar = async () => setMarcas(await obtenerMarcas());

  const limpiar = () => {
    setEditando(null);
    setFormulario(formularioVacio);
  };

  const cambiar = (campo: keyof typeof formulario, valor: string) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      const datos = {
        ...formulario,
        nombre: formulario.nombre.trim(),
        logo: formulario.logo.trim(),
      };
      if (editando === null) {
        await crearMarca(datos);
      } else {
        await actualizarMarca(editando, datos);
      }
      await cargar();
      limpiar();
      setMensaje(english ? 'Brand saved.' : 'Marca guardada.');
    } catch (saveError) {
      console.error('No se pudo guardar la marca.', saveError);
      setError(saveError instanceof Error
        ? saveError.message
        : (english ? 'Unable to save brand.' : 'No se pudo guardar la marca.'));
    }
  };

  const alternarEstado = async (marca: Marca) => {
    setError('');
    setMensaje('');
    try {
      await cambiarEstadoMarca(marca.id_marca, marca.estado === 'Activo' ? 'Inactivo' : 'Activo');
      await cargar();
    } catch (stateError) {
      console.error('No se pudo cambiar el estado de la marca.', stateError);
      setError(stateError instanceof Error
        ? stateError.message
        : (english ? 'Unable to update brand status.' : 'No se pudo actualizar el estado de la marca.'));
    }
  };

  return (
    <div>
      <h2>{english ? 'Brands' : 'Marcas'}</h2>
      <form className="catalog-admin-form" onSubmit={(event) => void enviar(event)}>
        <h3>{editando === null
          ? (english ? 'Add brand' : 'Agregar marca')
          : (english ? 'Edit brand' : 'Editar marca')}</h3>
        <label>
          {english ? 'Name' : 'Nombre'}
          <input maxLength={100} value={formulario.nombre} onChange={(event) => cambiar('nombre', event.target.value)} required />
        </label>
        <label>
          {english ? 'Description' : 'Descripción'}
          <textarea rows={3} value={formulario.descripcion} onChange={(event) => cambiar('descripcion', event.target.value)} required />
        </label>
        <label>
          {english ? 'Logo path' : 'Ruta del logo'}
          <input maxLength={255} value={formulario.logo} onChange={(event) => cambiar('logo', event.target.value)} required />
        </label>
        <label>
          {english ? 'Status' : 'Estado'}
          <select value={formulario.estado} onChange={(event) => cambiar('estado', event.target.value)} required>
            <option value="Activo">{english ? 'Active' : 'Activo'}</option>
            <option value="Inactivo">{english ? 'Inactive' : 'Inactivo'}</option>
          </select>
        </label>
        <div className="catalog-form-actions">
          <button className="btn-submit" type="submit">{english ? 'Save' : 'Guardar'}</button>
          {editando !== null && (
            <button type="button" className="catalog-cancel" onClick={limpiar}>
              {english ? 'Cancel' : 'Cancelar'}
            </button>
          )}
        </div>
      </form>

      {error && <p className="error-message" role="alert">{error}</p>}
      {mensaje && <p className="success-message" role="status">{mensaje}</p>}
      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>ID</th><th>{english ? 'Name' : 'Nombre'}</th>
              <th>{english ? 'Logo' : 'Logo'}</th><th>{english ? 'Status' : 'Estado'}</th>
              <th>{english ? 'Actions' : 'Acciones'}</th>
            </tr>
          </thead>
          <tbody>
            {marcas.map((marca) => (
              <tr key={marca.id_marca}>
                <td>{marca.id_marca}</td>
                <td>{marca.nombre}</td>
                <td>{marca.logo}</td>
                <td>{marca.estado}</td>
                <td className="catalog-table-actions">
                  <button type="button" onClick={() => {
                    setEditando(marca.id_marca);
                    setFormulario({
                      nombre: marca.nombre,
                      descripcion: marca.descripcion,
                      logo: marca.logo,
                      estado: marca.estado,
                    });
                    setError('');
                    setMensaje('');
                  }}>{english ? 'Edit' : 'Editar'}</button>
                  <button type="button" onClick={() => void alternarEstado(marca)}>
                    {marca.estado === 'Activo'
                      ? (english ? 'Deactivate' : 'Inactivar')
                      : (english ? 'Activate' : 'Activar')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {marcas.length === 0 && <p>{english ? 'No brands yet.' : 'Aún no hay marcas.'}</p>}
      </div>
    </div>
  );
};

export default AdminMarcasCosmeticLab;
