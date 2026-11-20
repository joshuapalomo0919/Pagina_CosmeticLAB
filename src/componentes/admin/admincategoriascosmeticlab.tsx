import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCosmetic } from '../../context/cosmeticlab';
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from '../../data/repositorios/categoriarepo';
import type { Categoria } from '../../types/modelos';

const reportarErrorCarga = (
  error: unknown,
  english: boolean,
  setError: Dispatch<SetStateAction<string>>,
): void => {
  console.error('No se pudieron cargar las categorías.', error);
  setError(english ? 'Unable to load categories.' : 'No se pudieron cargar las categorías.');
};

const AdminCategoriasCosmeticLab = () => {
  const { language } = useCosmetic();
  const english = language === 'en';
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editando, setEditando] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const obtenerCategorias = useCallback(async () => listarCategorias(), []);

  useEffect(() => {
    void obtenerCategorias()
      .then(setCategorias)
      .catch((loadError: unknown) => reportarErrorCarga(loadError, english, setError));
  }, [obtenerCategorias, english]);

  const cargar = async () => setCategorias(await obtenerCategorias());

  const limpiar = () => {
    setEditando(null);
    setNombre('');
    setDescripcion('');
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      if (editando === null) {
        await crearCategoria({ nombre: nombre.trim(), descripcion });
      } else {
        await actualizarCategoria(editando, { nombre: nombre.trim(), descripcion });
      }
      await cargar();
      limpiar();
      setMensaje(english ? 'Category saved.' : 'Categoría guardada.');
    } catch (saveError) {
      console.error('No se pudo guardar la categoría.', saveError);
      setError(saveError instanceof Error
        ? saveError.message
        : (english ? 'Unable to save category.' : 'No se pudo guardar la categoría.'));
    }
  };

  const borrar = async (id: number) => {
    setError('');
    setMensaje('');
    try {
      await eliminarCategoria(id);
      await cargar();
    } catch (deleteError) {
      console.error('No se pudo eliminar la categoría.', deleteError);
      setError(deleteError instanceof Error
        ? deleteError.message
        : (english ? 'Unable to delete category.' : 'No se pudo eliminar la categoría.'));
    }
  };

  return (
    <div>
      <h2>{english ? 'Categories' : 'Categorías'}</h2>
      <form className="catalog-admin-form" onSubmit={(event) => void enviar(event)}>
        <h3>{editando === null
          ? (english ? 'Add category' : 'Agregar categoría')
          : (english ? 'Edit category' : 'Editar categoría')}</h3>
        <label>
          {english ? 'Name' : 'Nombre'}
          <input maxLength={100} value={nombre} onChange={(event) => setNombre(event.target.value)} required />
        </label>
        <label>
          {english ? 'Description' : 'Descripción'}
          <textarea maxLength={255} rows={3} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} required />
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
              <th>{english ? 'Description' : 'Descripción'}</th><th>{english ? 'Actions' : 'Acciones'}</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => (
              <tr key={categoria.id_categoria}>
                <td>{categoria.id_categoria}</td>
                <td>{categoria.nombre}</td>
                <td>{categoria.descripcion}</td>
                <td className="catalog-table-actions">
                  <button type="button" onClick={() => {
                    setEditando(categoria.id_categoria);
                    setNombre(categoria.nombre);
                    setDescripcion(categoria.descripcion);
                    setError('');
                    setMensaje('');
                  }}>{english ? 'Edit' : 'Editar'}</button>
                  <button type="button" onClick={() => void borrar(categoria.id_categoria)}>
                    {english ? 'Delete' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categorias.length === 0 && <p>{english ? 'No categories yet.' : 'Aún no hay categorías.'}</p>}
      </div>
    </div>
  );
};

export default AdminCategoriasCosmeticLab;
