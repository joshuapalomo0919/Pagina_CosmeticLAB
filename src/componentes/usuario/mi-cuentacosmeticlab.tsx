import { useState } from 'react';
import type { FormEvent } from 'react';
import type { RegisteredUser } from '../../types/modelos';
import { useAuth } from '../../context/authcosmeticlab';
import { useCosmetic } from '../../context/cosmeticlab';
import { actualizarUsuario } from '../../data/repositorios/usuariorepo';

type PerfilForm = Pick<RegisteredUser, 'firstName' | 'lastName' | 'phone' | 'country' | 'city'>;

const MiCuentaCosmeticLab = () => {
  const { currentUser, actualizarUsuarioActual } = useAuth();
  const { language } = useCosmetic();
  const english = language === 'en';
  const [form, setForm] = useState<PerfilForm>(() => ({
    firstName: currentUser?.firstName ?? '',
    lastName: currentUser?.lastName ?? '',
    phone: currentUser?.phone ?? '',
    country: currentUser?.country ?? '',
    city: currentUser?.city ?? '',
  }));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) return;
    setError('');
    setMessage('');
    try {
      const actualizado = await actualizarUsuario(currentUser.id, form);
      actualizarUsuarioActual(actualizado);
      setMessage(english ? 'Your profile has been updated.' : 'Tu perfil se actualizó correctamente.');
    } catch (saveError) {
      console.error('No se pudo actualizar el perfil.', saveError);
      setError(english ? 'Unable to update your profile.' : 'No se pudo actualizar tu perfil.');
    }
  };

  const cambiar = (campo: keyof PerfilForm, valor: string) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  return (
    <div>
      <h2>{english ? 'Profile details' : 'Datos del perfil'}</h2>
      {currentUser && <p className="profile-email">{currentUser.email}</p>}
      <form className="profile-form" onSubmit={(event) => void enviar(event)}>
        <label>{english ? 'First name' : 'Nombre'}<input value={form.firstName} onChange={(event) => cambiar('firstName', event.target.value)} required /></label>
        <label>{english ? 'Last name' : 'Apellido'}<input value={form.lastName} onChange={(event) => cambiar('lastName', event.target.value)} required /></label>
        <label>{english ? 'Phone' : 'Teléfono'}<input value={form.phone} onChange={(event) => cambiar('phone', event.target.value)} /></label>
        <label>{english ? 'Country' : 'País'}<input value={form.country} onChange={(event) => cambiar('country', event.target.value)} /></label>
        <label>{english ? 'City' : 'Ciudad'}<input value={form.city} onChange={(event) => cambiar('city', event.target.value)} /></label>
        {error && <p className="error-message" role="alert">{error}</p>}
        {message && <p className="success-message" role="status">{message}</p>}
        <button className="btn-submit" type="submit">{english ? 'Save changes' : 'Guardar cambios'}</button>
      </form>
    </div>
  );
};

export default MiCuentaCosmeticLab;
