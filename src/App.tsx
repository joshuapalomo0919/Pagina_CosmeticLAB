import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CosmeticProvider } from './context/cosmeticlab';
import { AuthProvider } from './context/authcosmeticlab';
import HomeCosmeticLab from './componentes/homecosmeticlab';
import ProductosCosmeticLab from './componentes/productoscosmeticlab';
import LoginCosmeticLab from './componentes/logincosmeticlab';
import RegistroCosmeticLab from './componentes/registrocosmeticlab';
import NavBar from './componentes/navbarcosmeticlab';
import RutaProtegida from './componentes/rutaprotegidacosmeticlab';
import AdminLayoutCosmeticLab from './componentes/admin/adminlayoutcosmeticlab';
import AdminInicioCosmeticLab from './componentes/admin/admininiciocosmeticlab';
import AdminUsuariosCosmeticLab from './componentes/admin/adminusuarioscosmeticlab';
import AdminCategoriasCosmeticLab from './componentes/admin/admincategoriascosmeticlab';
import AdminMarcasCosmeticLab from './componentes/admin/adminmarcascosmeticlab';
import AdminProductosCosmeticLab from './componentes/admin/adminproductoscosmeticlab';
import AdminCitasCosmeticLab from './componentes/admin/admincitascosmeticlab';
import CitasCosmeticLab from './componentes/citascosmeticlab';
import UsuarioLayoutCosmeticLab from './componentes/usuario/usuariolayoutcosmeticlab';
import MiCuentaCosmeticLab from './componentes/usuario/mi-cuentacosmeticlab';
import './App.css';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    window.history.scrollRestoration = 'manual';

    if (hash) {
      requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }));
      return;
    }

    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, [pathname, hash]);

  return null;
};

function App() {
  return (
    <CosmeticProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="app-container">
            <NavBar />
            <Routes>
              <Route path="/" element={<HomeCosmeticLab />} />
              <Route path="/productos" element={<ProductosCosmeticLab />} />
              <Route element={<RutaProtegida roles={[2]} />}>
                <Route path="/citas" element={<CitasCosmeticLab />} />
              </Route>
              <Route path="/login" element={<LoginCosmeticLab />} />
              <Route path="/registro" element={<RegistroCosmeticLab />} />
              <Route element={<RutaProtegida roles={[1]} />}>
                <Route path="/admin" element={<AdminLayoutCosmeticLab />}>
                  <Route index element={<AdminInicioCosmeticLab />} />
                  <Route path="usuarios" element={<AdminUsuariosCosmeticLab />} />
                  <Route path="categorias" element={<AdminCategoriasCosmeticLab />} />
                  <Route path="marcas" element={<AdminMarcasCosmeticLab />} />
                  <Route path="productos" element={<AdminProductosCosmeticLab />} />
                  <Route path="citas" element={<AdminCitasCosmeticLab />} />
                </Route>
              </Route>
              <Route element={<RutaProtegida roles={[2]} />}>
                <Route path="/mi-cuenta" element={<UsuarioLayoutCosmeticLab />}>
                  <Route index element={<MiCuentaCosmeticLab />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </CosmeticProvider>
  );
}

export default App;