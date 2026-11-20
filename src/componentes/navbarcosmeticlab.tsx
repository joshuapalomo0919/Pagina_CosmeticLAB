import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcosmeticlab';
import { useCosmetic } from '../context/cosmeticlab';
import CartDrawer from './carritodrawercosmeticlab';

const NavBar = () => {
  const { cart, language, toggleLanguage } = useCosmetic();
  const { currentUser, isAdmin, logout } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
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
          <Link to="/">{copy.home}</Link>
          <Link to="/productos">{copy.products}</Link>
          <Link to="/citas">{copy.appointments}</Link>
          <a href="/#nosotros">{copy.about}</a>
          <a href="/#contacto">{copy.contact}</a>
        </div>
        <div className="nav-actions">
          {logoutError && <span className="nav-error" role="alert">{logoutError}</span>}
          <button className="lang" onClick={toggleLanguage} aria-label="Cambiar idioma">◎ {language.toUpperCase()}</button>
          <button className="cart-icon" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
            <span className="cart-symbol" aria-hidden="true">💄</span>
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
