import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCosmetic } from '../../context/cosmeticlab';
import { eliminarProducto } from '../../data/repositorios/productorepo';
import {
  cambiarPrecio,
  guardarProducto,
  obtenerCatalogoAdmin,
  obtenerHistorialPrecios,
} from '../../data/servicios/catalogoservice';
import { listarCategorias } from '../../data/repositorios/categoriarepo';
import { listarMarcas } from '../../data/repositorios/marcarepo';
import type { Categoria, DetalleProducto, Marca, ProductoVista } from '../../types/modelos';
import { formatearMoneda } from '../../utils/formato';

interface FormularioProducto {
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  imagen: string;
  destacado: boolean;
  id_categoria: string;
  id_marca: string;
  costo: string;
  stock_minimo: string;
}

const formularioVacio: FormularioProducto = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '0',
  imagen: '',
  destacado: false,
  id_categoria: '',
  id_marca: '',
  costo: '',
  stock_minimo: '0',
};

const reportarErrorCarga = (
  error: unknown,
  english: boolean,
  setError: Dispatch<SetStateAction<string>>,
): void => {
  console.error('No se pudo cargar el catálogo de administración.', error);
  setError(english ? 'Unable to load catalog data.' : 'No se pudieron cargar los datos del catálogo.');
};

const AdminProductosCosmeticLab = () => {
  const { language } = useCosmetic();
  const english = language === 'en';
  const [productos, setProductos] = useState<ProductoVista[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editando, setEditando] = useState<number | null>(null);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [historial, setHistorial] = useState<DetalleProducto[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const obtenerDatosCatalogo = useCallback(async () => Promise.all([
      obtenerCatalogoAdmin(),
      listarCategorias(),
      listarMarcas(),
  ]), []);

  useEffect(() => {
    let active = true;
    void obtenerDatosCatalogo()
      .then(([catalogo, listaCategorias, listaMarcas]) => {
        if (!active) return;
        setProductos(catalogo);
        setCategorias(listaCategorias);
        setMarcas(listaMarcas);
      })
      .catch((loadError: unknown) => {
        if (active) reportarErrorCarga(loadError, english, setError);
      });
    return () => {
      active = false;
    };
  }, [obtenerDatosCatalogo, english]);

  const cargarCatalogo = async () => {
    try {
      const [catalogo, listaCategorias, listaMarcas] = await obtenerDatosCatalogo();
      setProductos(catalogo);
      setCategorias(listaCategorias);
      setMarcas(listaMarcas);
    } catch (loadError) {
      reportarErrorCarga(loadError, english, setError);
      throw loadError;
    }
  };

  useEffect(() => {
    if (seleccionado === null) {
      return;
    }
    let active = true;
    void obtenerHistorialPrecios(seleccionado)
      .then((filas) => {
        if (active) setHistorial(filas);
      })
      .catch((historyError: unknown) => {
        if (active) reportarErrorCarga(historyError, english, setError);
      })
      .finally(() => {
        if (active) setCargandoHistorial(false);
      });
    return () => {
      active = false;
    };
  }, [seleccionado, english]);

  const marcasDisponibles = useMemo(() => marcas.filter((marca) => (
    marca.estado === 'Activo' || marca.id_marca === Number(formulario.id_marca)
  )), [marcas, formulario.id_marca]);

  const limpiar = () => {
    setEditando(null);
    setFormulario(formularioVacio);
  };

  const cambiarCampo = (campo: keyof FormularioProducto, valor: string | boolean) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const editarProducto = (producto: ProductoVista) => {
    setEditando(producto.id_producto);
    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: String(producto.precio),
      stock: String(producto.stock),
      imagen: producto.imagen,
      destacado: producto.destacado === 1,
      id_categoria: String(producto.id_categoria),
      id_marca: String(producto.id_marca),
      costo: producto.detalle_vigente ? String(producto.detalle_vigente.costo) : '',
      stock_minimo: producto.detalle_vigente ? String(producto.detalle_vigente.stock_minimo) : '0',
    });
    setError('');
    setMensaje('');
  };

  const enviarProducto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      await guardarProducto({
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        imagen: formulario.imagen.trim(),
        destacado: formulario.destacado ? 1 : 0,
        id_categoria: Number(formulario.id_categoria),
        id_marca: Number(formulario.id_marca),
        costo: Number(formulario.costo),
        stock_minimo: Number(formulario.stock_minimo),
      }, editando ?? undefined);
      await cargarCatalogo();
      limpiar();
      setMensaje(english ? 'Product saved with its price and inventory record.' : 'Producto guardado con su registro de precio e inventario.');
    } catch (saveError) {
      console.error('No se pudo guardar el producto.', saveError);
      setError(saveError instanceof Error
        ? saveError.message
        : (english ? 'Unable to save product.' : 'No se pudo guardar el producto.'));
    }
  };

  const borrarProducto = async (idProducto: number) => {
    setError('');
    setMensaje('');
    try {
      await eliminarProducto(idProducto);
      await cargarCatalogo();
      if (seleccionado === idProducto) setSeleccionado(null);
    } catch (deleteError) {
      console.error('No se pudo eliminar el producto.', deleteError);
      setError(deleteError instanceof Error
        ? deleteError.message
        : (english ? 'Unable to delete product.' : 'No se pudo eliminar el producto.'));
    }
  };

  const actualizarPrecio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (seleccionado === null) return;
    const datos = new FormData(event.currentTarget);
    setError('');
    setMensaje('');
    try {
      await cambiarPrecio(seleccionado, {
        costo: Number(datos.get('costo')),
        precio_venta: Number(datos.get('precio_venta')),
        stock_minimo: Number(datos.get('stock_minimo')),
      });
      await cargarCatalogo();
      setMensaje(english ? 'Price updated and previous price closed.' : 'Precio actualizado y vigencia anterior cerrada.');
    } catch (priceError) {
      console.error('No se pudo cambiar el precio del producto.', priceError);
      setError(priceError instanceof Error
        ? priceError.message
        : (english ? 'Unable to update product price.' : 'No se pudo cambiar el precio del producto.'));
    }
  };

  const productoSeleccionado = productos.find((producto) => producto.id_producto === seleccionado);

  const alternarHistorial = (idProducto: number) => {
    const nuevoSeleccionado = seleccionado === idProducto ? null : idProducto;
    setSeleccionado(nuevoSeleccionado);
    setCargandoHistorial(nuevoSeleccionado !== null);
    if (nuevoSeleccionado === null) setHistorial([]);
    setError('');
  };

  return (
    <div>
      <h2>{english ? 'Products' : 'Productos'}</h2>
      <form className="catalog-admin-form product-admin-form" onSubmit={(event) => void enviarProducto(event)}>
        <h3>{editando === null
          ? (english ? 'Add product' : 'Agregar producto')
          : (english ? `Edit product #${editando}` : `Editar producto #${editando}`)}</h3>
        <label>
          {english ? 'Name' : 'Nombre'}
          <input maxLength={150} value={formulario.nombre} onChange={(event) => cambiarCampo('nombre', event.target.value)} required />
        </label>
        <label>
          {english ? 'Description' : 'Descripción'}
          <textarea rows={3} value={formulario.descripcion} onChange={(event) => cambiarCampo('descripcion', event.target.value)} required />
        </label>
        <label>
          {english ? 'Category' : 'Categoría'}
          <select value={formulario.id_categoria} onChange={(event) => cambiarCampo('id_categoria', event.target.value)} required>
            <option value="">{english ? 'Select category' : 'Selecciona categoría'}</option>
            {categorias.map((categoria) => (
              <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          {english ? 'Brand' : 'Marca'}
          <select value={formulario.id_marca} onChange={(event) => cambiarCampo('id_marca', event.target.value)} required>
            <option value="">{english ? 'Select brand' : 'Selecciona marca'}</option>
            {marcasDisponibles.map((marca) => (
              <option key={marca.id_marca} value={marca.id_marca}>{marca.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          {english ? 'Sale price (COP)' : 'Precio de venta (COP)'}
          <input type="number" min="0" step="0.01" value={formulario.precio} onChange={(event) => cambiarCampo('precio', event.target.value)} required />
        </label>
        <label>
          {english ? 'Cost (COP)' : 'Costo (COP)'}
          <input type="number" min="0" step="0.01" value={formulario.costo} onChange={(event) => cambiarCampo('costo', event.target.value)} required />
        </label>
        <label>
          {english ? 'Stock' : 'Stock'}
          <input type="number" min="0" step="1" value={formulario.stock} onChange={(event) => cambiarCampo('stock', event.target.value)} required />
        </label>
        <label>
          {english ? 'Minimum stock' : 'Stock mínimo'}
          <input type="number" min="0" step="1" value={formulario.stock_minimo} onChange={(event) => cambiarCampo('stock_minimo', event.target.value)} required />
        </label>
        <label>
          {english ? 'Image path' : 'Ruta de imagen'}
          <input maxLength={255} value={formulario.imagen} onChange={(event) => cambiarCampo('imagen', event.target.value)} required />
        </label>
        <label className="catalog-checkbox">
          <input type="checkbox" checked={formulario.destacado} onChange={(event) => cambiarCampo('destacado', event.target.checked)} />
          {english ? 'Featured' : 'Destacado'}
        </label>
        {editando !== null && (
          <p className="catalog-readonly">
            ID: {editando} · {english ? 'Status' : 'Estado'}: {productos.find((p) => p.id_producto === editando)?.estado}
            {' · '}{english ? 'Registered' : 'Fecha de registro'}: {productos.find((p) => p.id_producto === editando)?.fecha_registro}
          </p>
        )}
        <div className="catalog-form-actions">
          <button className="btn-submit" type="submit">{english ? 'Save product' : 'Guardar producto'}</button>
          {editando !== null && (
            <button type="button" className="catalog-cancel" onClick={limpiar}>{english ? 'Cancel' : 'Cancelar'}</button>
          )}
        </div>
      </form>

      {error && <p className="error-message" role="alert">{error}</p>}
      {mensaje && <p className="success-message" role="status">{mensaje}</p>}
      <div className="panel-table-wrap">
        <table className="panel-table">
          <thead>
            <tr>
              <th>ID</th><th>{english ? 'Product' : 'Producto'}</th>
              <th>{english ? 'Category' : 'Categoría'}</th><th>{english ? 'Brand' : 'Marca'}</th>
              <th>{english ? 'Price' : 'Precio'}</th><th>{english ? 'Stock' : 'Stock'}</th>
              <th>{english ? 'Status' : 'Estado'}</th><th>{english ? 'Actions' : 'Acciones'}</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id_producto} id={`producto-${producto.id_producto}`}>
                <td>{producto.id_producto}</td>
                <td>{producto.nombre}{producto.detalle_vigente === null && (
                  <small className="catalog-warning">{english ? 'No current price' : 'Sin precio vigente'}</small>
                )}</td>
                <td>{producto.categoria_nombre}</td>
                <td>{producto.marca_nombre}</td>
                <td>{formatearMoneda(producto.precio)}</td>
                <td>{producto.stock}</td>
                <td>{producto.estado}</td>
                <td className="catalog-table-actions">
                  <button type="button" onClick={() => editarProducto(producto)}>{english ? 'Edit' : 'Editar'}</button>
                  <button type="button" onClick={() => alternarHistorial(producto.id_producto)}>
                    {english ? 'Price history' : 'Historial de precios'}
                  </button>
                  <button type="button" onClick={() => void borrarProducto(producto.id_producto)}>
                    {english ? 'Delete' : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && <p>{english ? 'No products yet.' : 'Aún no hay productos.'}</p>}
      </div>

      {seleccionado !== null && (
        <section className="price-history">
          <h3>
            {english ? 'Price history' : 'Historial de precios'}
            {productoSeleccionado ? ` · ${productoSeleccionado.nombre}` : ''}
          </h3>
          {cargandoHistorial ? (
            <p>{english ? 'Loading history...' : 'Cargando historial...'}</p>
          ) : historial.length === 0 ? (
            <p>{english ? 'No price history.' : 'No hay historial de precios.'}</p>
          ) : (
            <div className="panel-table-wrap">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>ID</th><th>{english ? 'Cost' : 'Costo'}</th>
                    <th>{english ? 'Sale price' : 'Precio venta'}</th><th>{english ? 'Stock' : 'Stock'}</th>
                    <th>{english ? 'Min. stock' : 'Stock mínimo'}</th>
                    <th>{english ? 'Start' : 'Inicio'}</th><th>{english ? 'End' : 'Fin'}</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((detalle) => (
                    <tr key={detalle.id_detalle_producto}>
                      <td>{detalle.id_detalle_producto}</td>
                      <td>{formatearMoneda(detalle.costo)}</td>
                      <td>{formatearMoneda(detalle.precio_venta)}</td>
                      <td>{detalle.stock}</td>
                      <td>{detalle.stock_minimo}</td>
                      <td>{detalle.fecha_ini}</td>
                      <td>{detalle.fecha_fin ?? (english ? 'Current' : 'Vigente')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form className="price-change-form" onSubmit={(event) => void actualizarPrecio(event)}>
            <h4>{english ? 'Set new current price' : 'Definir nuevo precio vigente'}</h4>
            <label>{english ? 'Cost (COP)' : 'Costo (COP)'}<input name="costo" type="number" min="0" step="0.01" required /></label>
            <label>{english ? 'Sale price (COP)' : 'Precio de venta (COP)'}<input name="precio_venta" type="number" min="0" step="0.01" required /></label>
            <label>{english ? 'Minimum stock' : 'Stock mínimo'}<input name="stock_minimo" type="number" min="0" step="1" required /></label>
            <button className="btn-submit" type="submit">{english ? 'Update price' : 'Cambiar precio'}</button>
          </form>
        </section>
      )}
    </div>
  );
};

export default AdminProductosCosmeticLab;
