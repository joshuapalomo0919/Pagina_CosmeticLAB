import { NavLink, Outlet } from 'react-router-dom';
import { useCosmetic } from '../../context/cosmeticlab';
import '../../estilos/admin.css';

const AdminLayoutCosmeticLab = () => {
  const { language } = useCosmetic();
  const copy = language === 'es'
    ? {
      title: 'Administración', overview: 'Resumen', users: 'Usuarios',
      categories: 'Categorías', brands: 'Marcas', products: 'Productos', appointments: 'Citas',
    }
    : {
      title: 'Administration', overview: 'Overview', users: 'Users',
      categories: 'Categories', brands: 'Brands', products: 'Products', appointments: 'Appointments',
    };

  return (
    <main className="panel-page">
      <header className="panel-heading">
        <span className="section-kicker">CosmeticLAB</span>
        <h1>{copy.title}</h1>
      </header>
      <div className="panel-layout">
        <nav className="panel-menu" aria-label={copy.title}>
          <NavLink end to="/admin">{copy.overview}</NavLink>
          <NavLink to="/admin/usuarios">{copy.users}</NavLink>
          <NavLink to="/admin/categorias">{copy.categories}</NavLink>
          <NavLink to="/admin/marcas">{copy.brands}</NavLink>
          <NavLink to="/admin/productos">{copy.products}</NavLink>
          <NavLink to="/admin/citas">{copy.appointments}</NavLink>
        </nav>
        <section className="panel-content"><Outlet /></section>
      </div>
    </main>
  );
};

export default AdminLayoutCosmeticLab;
