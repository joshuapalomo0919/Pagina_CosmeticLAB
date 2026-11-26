import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../context/cosmeticlab';
import { useCosmetic } from '../context/cosmeticlab';
import { listarCategorias } from '../data/repositorios/categoriarepo';
import { listarMarcas } from '../data/repositorios/marcarepo';
import { obtenerCatalogo } from '../data/servicios/catalogoservice';
import type { Categoria, Marca, ProductoVista } from '../types/modelos';
import { formatearMoneda } from '../utils/formato';
import ImagenProducto from './imagenproductocosmeticlab';
import '../estilos/catalogo.css';

/**
 * @deprecated Datos de demostración heredados; el catálogo usa los repositorios.
 */
export const mockProducts = [
  { id: 1, name: 'Serum Hidratante Plus', category: 'Cuidado Facial', price: 45.00, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=85' },
  { id: 2, name: 'Crema Corporal Nutritiva', category: 'Cuidado Corporal', price: 32.00, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=85' },
  { id: 3, name: 'Kit Esencial Dia', category: 'Cuidado Facial', price: 85.00, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=85' },
  { id: 4, name: 'Labial Velvet Nude', category: 'Maquillaje', price: 24.00, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=85' },
  { id: 5, name: 'Paleta Soft Glow', category: 'Maquillaje', price: 39.00, image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=85' },
  { id: 6, name: 'Protector Solar SPF 50', category: 'Cuidado Facial', price: 29.00, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=85' },
];

const aItemCarrito = (producto: ProductoVista): Product => ({
  id: producto.id_producto,
  name: producto.nombre,
  category: producto.categoria_nombre,
  price: producto.precio,
  image: producto.imagen,
});

const ProductosCosmeticLab = () => {
  const { addToCart, language } = useCosmetic();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [productos, setProductos] = useState<ProductoVista[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<number | null>(null);
  const [productoDetalle, setProductoDetalle] = useState<ProductoVista | null>(null);
  const categoriasDropdown = useRef<HTMLDetailsElement>(null);
  const dialogoDetalle = useRef<HTMLDialogElement>(null);
  const [orden, setOrden] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const english = language === 'en';

  useEffect(() => {
    let active = true;
    void Promise.all([listarCategorias(), listarMarcas(), obtenerCatalogo()])
      .then(([categoriasCargadas, marcasCargadas, catalogo]) => {
        if (!active) return;
        setCategorias(categoriasCargadas);
        setMarcas(marcasCargadas.filter((marca) => marca.estado === 'Activo'));
        setProductos(catalogo);
        setError('');
      })
      .catch((loadError: unknown) => {
        console.error('No se pudo cargar el catálogo.', loadError);
        if (active) {
          setError(english ? 'The catalog could not be loaded.' : 'No se pudo cargar el catálogo.');
        }
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [english]);

  const productosVisibles = useMemo(() => productos
    .filter((producto) => categoriaSeleccionada === null || producto.id_categoria === categoriaSeleccionada)
    .filter((producto) => marcaSeleccionada === null || producto.id_marca === marcaSeleccionada)
    .sort((a, b) => {
      if (orden === 'price-low') return a.precio - b.precio;
      if (orden === 'price-high') return b.precio - a.precio;
      return b.destacado - a.destacado || a.id_producto - b.id_producto;
    }), [productos, categoriaSeleccionada, marcaSeleccionada, orden]);

  useEffect(() => {
    const dialogo = dialogoDetalle.current;
    if (!dialogo) return;
    if (productoDetalle && !dialogo.open) dialogo.showModal();
    else if (!productoDetalle && dialogo.open) dialogo.close();
  }, [productoDetalle]);

  return (
    <div className="productos-container">
      <aside className="sidebar">
        <h3><span className="filter-icon">⌁</span> {english ? 'Categories' : 'Categorías'}</h3>
        <details ref={categoriasDropdown} className="category-dropdown">
          <summary>
            {categoriaSeleccionada === null
              ? (english ? 'All products' : 'Todas las categorías')
              : categorias.find((categoria) => categoria.id_categoria === categoriaSeleccionada)?.nombre}
          </summary>
          <ul className="category-list">
            <li>
              <button
                type="button"
                className={categoriaSeleccionada === null ? 'active' : ''}
                aria-pressed={categoriaSeleccionada === null}
                onClick={() => {
                  setCategoriaSeleccionada(null);
                  if (categoriasDropdown.current) categoriasDropdown.current.open = false;
                }}
              >
                {english ? 'All' : 'Todos'}
              </button>
            </li>
            {categorias.map((categoria) => (
              <li key={categoria.id_categoria}>
                <button
                  type="button"
                  className={categoriaSeleccionada === categoria.id_categoria ? 'active' : ''}
                  aria-pressed={categoriaSeleccionada === categoria.id_categoria}
                  onClick={() => {
                    setCategoriaSeleccionada(categoria.id_categoria);
                    if (categoriasDropdown.current) categoriasDropdown.current.open = false;
                  }}
                >
                  {categoria.nombre}
                </button>
              </li>
            ))}
          </ul>
        </details>
      </aside>

      <main className="product-main">
        <div className="product-header">
          <span>
            {productosVisibles.length} {english ? 'products found' : 'productos encontrados'}
          </span>
          <div className="catalog-controls">
            <label className="visually-hidden" htmlFor="brand-filter">
              {english ? 'Filter by brand' : 'Filtrar por marca'}
            </label>
            <select
              id="brand-filter"
              className="sort-select"
              value={marcaSeleccionada ?? ''}
              onChange={(event) => setMarcaSeleccionada(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">{english ? 'All brands' : 'Todas las marcas'}</option>
              {marcas.map((marca) => (
                <option key={marca.id_marca} value={marca.id_marca}>{marca.nombre}</option>
              ))}
            </select>
            <label className="visually-hidden" htmlFor="product-sort">
              {english ? 'Sort products' : 'Ordenar productos'}
            </label>
            <select
              id="product-sort"
              className="sort-select"
              value={orden}
              onChange={(event) => {
                const valor = event.target.value;
                if (valor === 'featured' || valor === 'price-low' || valor === 'price-high') {
                  setOrden(valor);
                }
              }}
            >
              <option value="featured">{english ? 'Featured' : 'Destacados'}</option>
              <option value="price-low">{english ? 'Lowest price' : 'Precio menor'}</option>
              <option value="price-high">{english ? 'Highest price' : 'Precio mayor'}</option>
            </select>
          </div>
        </div>

        {error && <p className="error-message catalog-message" role="alert">{error}</p>}
        {cargando ? (
          <p className="catalog-message" aria-live="polite">{english ? 'Loading products...' : 'Cargando productos...'}</p>
        ) : !error && productosVisibles.length === 0 ? (
          <p className="catalog-message">
            {english ? 'No products are available for this selection yet.' : 'Aún no hay productos disponibles para esta selección.'}
          </p>
        ) : (
          <div className="grid-productos">
            {productosVisibles.map((producto) => (
              <article key={producto.id_producto} className="product-card">
                <button
                  type="button"
                  className="product-detail-trigger"
                  onClick={() => setProductoDetalle(producto)}
                  aria-label={english ? `View details for ${producto.nombre}` : `Ver detalles de ${producto.nombre}`}
                >
                  <div className="img-container">
                    <ImagenProducto key={producto.imagen} src={producto.imagen} alt={producto.nombre} />
                    {producto.estado === 'Agotado' && (
                      <span className="stock-badge">{english ? 'Out of stock' : 'Agotado'}</span>
                    )}
                  </div>
                  <div className="info-container">
                    <span className="cat-label">{producto.categoria_nombre} · {producto.marca_nombre}</span>
                    <h4>{producto.nombre}</h4>
                  </div>
                </button>
                <div className="price-row product-card-actions">
                  <span className="price">{formatearMoneda(producto.precio)}</span>
                  <button
                    className="btn-cart"
                    type="button"
                    disabled={producto.estado === 'Agotado'}
                    onClick={() => addToCart(aItemCarrito(producto))}
                    aria-label={english ? `Add ${producto.nombre}` : `Agregar ${producto.nombre}`}
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <dialog
        ref={dialogoDetalle}
        className="product-detail-dialog"
        aria-labelledby="product-detail-title"
        onClose={() => setProductoDetalle(null)}
      >
        {productoDetalle && (
          <div className="product-detail-content">
            <button
              type="button"
              className="catalog-dialog-close product-detail-close"
              onClick={() => setProductoDetalle(null)}
              aria-label={english ? 'Close product details' : 'Cerrar detalle del producto'}
            >
              ×
            </button>
            <div className="product-detail-layout">
              <div className="product-detail-image">
                <ImagenProducto src={productoDetalle.imagen} alt={productoDetalle.nombre} />
              </div>
              <div className="product-detail-copy">
                <span className="cat-label">
                  {productoDetalle.categoria_nombre} · {productoDetalle.marca_nombre}
                </span>
                <h2 id="product-detail-title">{productoDetalle.nombre}</h2>
                <section>
                  <h3>{english ? 'Product information' : 'Información general'}</h3>
                  <p>{english ? 'Brand' : 'Marca'}: {productoDetalle.marca_nombre}</p>
                  <p>{english ? 'Category' : 'Categoría'}: {productoDetalle.categoria_nombre}</p>
                  <p>{english ? 'Price' : 'Precio'}: <strong>{formatearMoneda(productoDetalle.precio)}</strong></p>
                  <p>{english ? 'Availability' : 'Disponibilidad'}: {productoDetalle.estado === 'Disponible'
                    ? (english ? 'In stock' : 'Disponible')
                    : (english ? 'Out of stock' : 'Agotado')}</p>
                </section>
                <section className="product-detail-benefits">
                  <h3>{english ? 'Benefits' : 'Beneficios'}</h3>
                  <p>{productoDetalle.descripcion}</p>
                </section>
                <button
                  type="button"
                  className="btn-primary product-detail-add"
                  disabled={productoDetalle.estado === 'Agotado'}
                  onClick={() => addToCart(aItemCarrito(productoDetalle))}
                >
                  {english ? 'Add to cart' : 'Agregar al carrito'}
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

export default ProductosCosmeticLab;
