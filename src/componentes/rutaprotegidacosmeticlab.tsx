import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authcosmeticlab';
import { useCosmetic } from '../context/cosmeticlab';

interface RutaProtegidaProps {
  roles: number[];
}

const RutaProtegida = ({ roles }: RutaProtegidaProps) => {
  const { currentUser, roles: rolesUsuario, ready } = useAuth();
  const { language } = useCosmetic();
  const location = useLocation();

  if (!ready) {
    return <main className="protected-loading" aria-live="polite">
      {language === 'es' ? 'Cargando...' : 'Loading...'}
    </main>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!roles.some((rol) => rolesUsuario.includes(rol))) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default RutaProtegida;
