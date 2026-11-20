import { NavLink, Outlet } from 'react-router-dom';
import { useCosmetic } from '../../context/cosmeticlab';
import '../../estilos/usuario.css';

const UsuarioLayoutCosmeticLab = () => {
  const { language } = useCosmetic();
  const account = language === 'es' ? 'Mi cuenta' : 'My account';
  return (
    <main className="panel-page">
      <header className="panel-heading">
        <span className="section-kicker">CosmeticLAB</span>
        <h1>{account}</h1>
      </header>
      <div className="panel-layout">
        <nav className="panel-menu" aria-label={account}>
          <NavLink end to="/mi-cuenta">{account}</NavLink>
        </nav>
        <section className="panel-content"><Outlet /></section>
      </div>
    </main>
  );
};

export default UsuarioLayoutCosmeticLab;
