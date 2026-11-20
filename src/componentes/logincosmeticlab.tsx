import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCosmetic } from '../context/cosmeticlab';
import { useAuth } from '../context/authcosmeticlab';

export type { RegisteredUser } from '../types/modelos';

export const USERS_STORAGE_KEY = 'cosmeticlab_users';

const LoginCosmeticLab = () => {
  const { language } = useCosmetic();
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const registeredData = location.state as { email?: string; name?: string } | null;
  const [email, setEmail] = useState(registeredData?.email || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(registeredData?.name ? `Registro exitoso para ${registeredData.name}.` : '');
  const [error, setError] = useState('');
  const english = language === 'en';
  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const resultado = await login(email, password);
      if (!resultado.ok) {
        setError(english ? 'Email or password not found.' : 'Correo o contrasena incorrectos.');
        setMessage('');
        return;
      }
      if (!resultado.usuario || !resultado.roles) {
        throw new Error('El usuario autenticado no se encontró en el repositorio.');
      }
      setError('');
      setMessage(english ? `Successful login. Welcome, ${resultado.usuario.firstName}.` : `Inicio de sesion exitoso. Bienvenido, ${resultado.usuario.firstName}.`);
      const destino = (location.state as { from?: string } | null)?.from;
      navigate(destino || (resultado.roles.includes(1) ? '/admin' : '/mi-cuenta'), { replace: true });
    } catch (loginError) {
      console.error('No se pudo iniciar sesión.', loginError);
      setError(english ? 'Unable to sign in. Please try again.' : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
      setMessage('');
    }
  };
  return (
    <div className="login-container">
      <div className="login-card">
        <span className="section-kicker">CosmeticLAB community</span>
        <h2>{english ? 'Welcome back' : 'Bienvenido de nuevo'}</h2>
        <p className="subtitle">{english ? 'Sign in to continue your beauty ritual.' : 'Inicia sesion para continuar tu ritual de belleza.'}</p>
        
        <form className="login-form" onSubmit={submitLogin}>
          <div className="form-group">
            <label htmlFor="login-email">{english ? 'Email address' : 'Correo electronico'}</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" required />
            </div>
          </div>
          
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="login-password">{english ? 'Password' : 'Contrasena'}</label>
              <span className="link-recuperar">{english ? 'Private & secure' : 'Privado y seguro'}</span>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="********" required />
            </div>
          </div>
          
          <button type="submit" className="btn-submit">{english ? 'Sign in' : 'Iniciar sesion'}</button>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}
        </form>
        <p className="register-prompt">{english ? 'No account yet?' : 'Aun no tienes una cuenta?'} <Link to="/registro">{english ? 'Create one' : 'Registrate'}</Link></p>
      </div>
    </div>
  );
};

export default LoginCosmeticLab;