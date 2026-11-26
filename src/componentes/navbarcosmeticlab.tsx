import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcosmeticlab';
import { useCosmetic } from '../context/cosmeticlab';
import CartDrawer from './carritodrawercosmeticlab';

const NavBar = () => {
  const { cart, language, toggleLanguage } = useCosmetic();
  const { currentUser, isAdmin, logout } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [activeNavItem, setActiveNavItem] = useState('');
  const { pathname, hash } = useLocation();
  const total = cart.reduce((sum, product) => sum + product.price, 0);
  const copy = language === 'es'
    ? {
      home: 'Inicio', products: 'Productos', about: 'Nosotros', contact: 'Contacto',
      appointments: 'Citas', register: 'Registrarse', login: 'Iniciar sesion', account: 'Mi cuenta',
      panel: 'Panel', logout: 'Cerrar sesión',
    }
    : {
      home: 'Home', products: 'Products', about: 'About us', contact: 'Contact',
      appointments: 'Appointments', register: 'Sign up', login: 'Log in', account: 'My account',
      panel: 'Dashboard', logout: 'Log out',
    };

  useEffect(() => {
    const navbar = document.querySelector<HTMLElement>('.navbar');
    const actualizarEnlaceActivo = () => {
      const alturaNavbar = navbar?.getBoundingClientRect().height ?? 82;
      document.documentElement.style.setProperty('--navbar-height', `${Math.ceil(alturaNavbar)}px`);

      if (pathname === '/productos') {
        setActiveNavItem('products');
        return;
      }
      if (pathname === '/citas') {
        setActiveNavItem('appointments');
        return;
      }
      if (pathname !== '/') {
        setActiveNavItem('');
        return;
      }

      const secciones = [
        { id: 'inicio', item: 'home' },
        { id: 'nosotros', item: 'about' },
        { id: 'estilos-destacados', item: 'home' },
        { id: 'estilos', item: 'home' },
        { id: 'proceso', item: 'home' },
        { id: 'equipo', item: 'home' },
        { id: 'contacto', item: 'contact' },
      ];
      let actual = 'home';

      for (const seccion of secciones) {
        const elemento = document.getElementById(seccion.id);
        if (elemento && elemento.getBoundingClientRect().top <= alturaNavbar + 1) {
          actual = seccion.item;
        }
      }
      setActiveNavItem(actual);
    };

    const observadorNavbar = new ResizeObserver(actualizarEnlaceActivo);
    if (navbar) observadorNavbar.observe(navbar);
    const frameId = window.requestAnimationFrame(actualizarEnlaceActivo);
    window.addEventListener('scroll', actualizarEnlaceActivo, { passive: true });
    window.addEventListener('resize', actualizarEnlaceActivo);
    return () => {
      window.cancelAnimationFrame(frameId);
      observadorNavbar.disconnect();
      window.removeEventListener('scroll', actualizarEnlaceActivo);
      window.removeEventListener('resize', actualizarEnlaceActivo);
    };
  }, [pathname, hash]);

  const cerrarSesion = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('No se pudo cerrar la sesión.', error);
      setLogoutError(language === 'es'
        ? 'No se pudo cerrar la sesión. Inténtalo de nuevo.'
        : 'Unable to log out. Please try again.');
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <span className="drop-icon">✦</span> <strong translate="no">CosmeticLAB</strong>
        </div>
        <div className="nav-links">
          <Link to="/#inicio" aria-current={activeNavItem === 'home' ? 'page' : undefined}>{copy.home}</Link>
          <Link to="/productos" aria-current={activeNavItem === 'products' ? 'page' : undefined}>{copy.products}</Link>
          <Link to="/citas" aria-current={activeNavItem === 'appointments' ? 'page' : undefined}>{copy.appointments}</Link>
          <Link to="/#nosotros" aria-current={activeNavItem === 'about' ? 'page' : undefined}>{copy.about}</Link>
          <Link to="/#contacto" aria-current={activeNavItem === 'contact' ? 'page' : undefined}>{copy.contact}</Link>
        </div>
        <div className="nav-actions">
          {logoutError && <span className="nav-error" role="alert">{logoutError}</span>}
          <button className="lang" onClick={toggleLanguage} aria-label="Cambiar idioma">◎ {language.toUpperCase()}</button>
          <button className="cart-icon" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
            <img className="cart-symbol" src="/assets/carrito-de-compra.png" alt="" />
            {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
          </button>
          {currentUser ? (
            <>
              <Link to={isAdmin ? '/admin' : '/mi-cuenta'} className="btn-admin">
                {isAdmin ? copy.panel : copy.account}
              </Link>
              <button type="button" className="btn-admin" onClick={() => void cerrarSesion()}>{copy.logout}</button>
            </>
          ) : (
            <Link to="/login" className="btn-admin">{copy.login}</Link>
          )}
        </div>
      </nav>
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} total={total} />}
    </>
  );
};

export default NavBar;
