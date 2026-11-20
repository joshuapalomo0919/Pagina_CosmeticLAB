import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCosmetic } from '../../context/cosmeticlab';
import { listarUsuarios } from '../../data/repositorios/usuariorepo';
import { obtenerCatalogoAdmin } from '../../data/servicios/catalogoservice';
import type { ProductoVista } from '../../types/modelos';
import { listarDetallesProducto } from '../../data/repositorios/detalleproductorepo';

const AdminInicioCosmeticLab = () => {
  const { language } = useCosmetic();
  const [totalUsuarios, setTotalUsuarios] = useState<number | null>(null);
  const [stockBajo, setStockBajo] = useState<ProductoVista[]>([]);
  const [vigencias, setVigencias] = useState<{ producto: ProductoVista; fecha_fin: string }[]>([]);
  const [error, setError] = useState('');
  const english = language === 'en';

  useEffect(() => {
    let active = true;
    void Promise.all([listarUsuarios(), obtenerCatalogoAdmin(), listarDetallesProducto()])
      .then(([usuarios, productos, detalles]) => {
        if (!active) return;
        setTotalUsuarios(usuarios.length);
        setStockBajo(productos.filter((producto) => (
          producto.detalle_vigente !== null
          && producto.stock <= producto.detalle_vigente.stock_minimo
        )));
        const hoy = new Date();
        const limite = new Date(hoy);
        limite.setDate(limite.getDate() + 30);
        const fechaLimite = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')} ${String(limite.getHours()).padStart(2, '0')}:${String(limite.getMinutes()).padStart(2, '0')}:${String(limite.getSeconds()).padStart(2, '0')}`;
        const productosPorId = new Map(productos.map((producto) => [producto.id_producto, producto]));
        setVigencias(detalles.flatMap((detalle) => {
          const producto = productosPorId.get(detalle.id_producto);
          if (!producto || !detalle.fecha_fin) return [];
          const empieza = `${String(hoy.getFullYear()).padStart(4, '0')}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')} ${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}:${String(hoy.getSeconds()).padStart(2, '0')}`;
          return detalle.fecha_fin >= empieza && detalle.fecha_fin <= fechaLimite
            ? [{ producto, fecha_fin: detalle.fecha_fin }]
            : [];
        }));
      })
      .catch((loadError: unknown) => {
        console.error('No se pudieron cargar los datos del panel de administración.', loadError);
        if (active) setError(english ? 'Unable to load dashboard data.' : 'No se pudieron cargar los datos del panel.');
      });
    return () => {
      active = false;
    };
  }, [english]);

  return (
    <div>
      <h2>{english ? 'Dashboard' : 'Panel principal'}</h2>
      {error && <p className="error-message" role="alert">{error}</p>}
      <article className="panel-stat">
        <span>{english ? 'Registered users' : 'Usuarios registrados'}</span>
        <strong>{totalUsuarios ?? '—'}</strong>
        <Link to="/admin/usuarios">{english ? 'Manage users' : 'Gestionar usuarios'}</Link>
      </article>
      <div className="catalog-alert-grid">
        <section>
          <h3>{english ? 'Low stock' : 'Stock bajo'}</h3>
          {stockBajo.length === 0
            ? <p>{english ? 'No low-stock products.' : 'No hay productos con stock bajo.'}</p>
            : stockBajo.map((producto) => (
              <p key={producto.id_producto}>
                <Link to={`/admin/productos#producto-${producto.id_producto}`}>{producto.nombre}</Link>
                {' · '}{producto.stock} / {producto.detalle_vigente?.stock_minimo}
              </p>
            ))}
        </section>
        <section>
          <h3>{english ? 'Prices expiring soon' : 'Vigencias por vencer'}</h3>
          {vigencias.length === 0
            ? <p>{english ? 'No prices expire in the next 30 days.' : 'No hay precios que venzan en los próximos 30 días.'}</p>
            : vigencias.map(({ producto, fecha_fin }) => (
              <p key={`${producto.id_producto}-${fecha_fin}`}>
                <Link to={`/admin/productos#producto-${producto.id_producto}`}>{producto.nombre}</Link>
                {' · '}{fecha_fin}
              </p>
            ))}
        </section>
      </div>
    </div>
  );
};

export default AdminInicioCosmeticLab;
