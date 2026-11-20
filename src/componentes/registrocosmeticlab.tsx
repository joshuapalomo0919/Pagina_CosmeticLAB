import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCosmetic } from '../context/cosmeticlab';
import { useAuth } from '../context/authcosmeticlab';

const emptyForm = {
  firstName: '',
  lastName: '',
  documentType: 'Cedula de ciudadania',
  documentNumber: '',
  birthDate: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  password: '',
  confirmPassword: '',
  terms: false,
};

type RegistrationForm = typeof emptyForm;

const RegistroCosmeticLab = () => {
  const { language } = useCosmetic();
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const english = language === 'en';
  const [form, setForm] = useState<RegistrationForm>(emptyForm);
  const [error, setError] = useState('');

  const updateField = (field: keyof RegistrationForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError(english ? 'Passwords do not match.' : 'Las contrasenas no coinciden.');
      return;
    }
    if (!form.terms) {
      setError(english ? 'Accept the data policy and terms to continue.' : 'Acepta la politica de datos y los terminos para continuar.');
      return;
    }

    try {
      const newUser = await registrar({
        firstName: form.firstName,
        lastName: form.lastName,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        birthDate: form.birthDate,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        password: form.password,
      });
      navigate('/login', { state: { email: newUser.email, name: newUser.firstName } });
    } catch (registrationError) {
      console.error('No se pudo completar el registro.', registrationError);
      setError(english ? 'This email is already registered or registration failed.' : 'Este correo ya existe o no se pudo completar el registro.');
    }
  };

  return (
    <main className="registration-page">
      <section className="registration-card">
        <div className="registration-heading">
          <span className="section-kicker">CosmeticLAB community</span>
          <h1>{english ? 'Create your account' : 'Crea tu cuenta'}</h1>
          <p>{english ? 'Join a more intentional beauty ritual.' : 'Unete a un ritual de belleza mas consciente.'}</p>
          <Link to="/login" className="back-login">{english ? 'Already have an account? Sign in' : 'Ya tienes una cuenta? Inicia sesion'}</Link>
        </div>

        <form className="registration-form" onSubmit={submitRegistration}>
          <fieldset>
            <legend>01. {english ? 'Personal information' : 'Datos personales'}</legend>
            <div className="form-grid two-columns">
              <label>{english ? 'First name' : 'Nombre'}<input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required /></label>
              <label>{english ? 'Last name' : 'Apellido'}<input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required /></label>
              <label>{english ? 'Document type' : 'Tipo de documento'}<select value={form.documentType} onChange={(event) => updateField('documentType', event.target.value)}><option>Cedula de ciudadania</option><option>Pasaporte</option><option>Cedula de extranjeria</option></select></label>
              <label>{english ? 'Document number' : 'Numero de documento'}<input value={form.documentNumber} onChange={(event) => updateField('documentNumber', event.target.value)} required /></label>
              <label>{english ? 'Date of birth' : 'Fecha de nacimiento'}<input type="date" value={form.birthDate} onChange={(event) => updateField('birthDate', event.target.value)} required /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>02. {english ? 'Contact details' : 'Datos de contacto'}</legend>
            <div className="form-grid two-columns">
              <label>{english ? 'Email address' : 'Correo electronico'}<input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required /></label>
              <label>{english ? 'Phone number' : 'Numero de telefono'}<input type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required /></label>
              <label>{english ? 'Password' : 'Contrasena'}<input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} minLength={6} required /></label>
              <label>{english ? 'Confirm password' : 'Confirmar contrasena'}<input type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} minLength={6} required /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>03. {english ? 'Address' : 'Domicilio'}</legend>
            <div className="form-grid two-columns">
              <label>{english ? 'Country of residence' : 'Pais de domicilio'}<input value={form.country} onChange={(event) => updateField('country', event.target.value)} required /></label>
              <label>{english ? 'City of residence' : 'Ciudad de domicilio'}<input value={form.city} onChange={(event) => updateField('city', event.target.value)} required /></label>
            </div>
          </fieldset>

          <label className="terms-check"><input type="checkbox" checked={form.terms} onChange={(event) => updateField('terms', event.target.checked)} required /> <span>{english ? <>I accept the <a href="#politica">data treatment policy</a> and terms of service.</> : <>Acepto la <a href="#politica">politica de tratamiento de datos</a> y terminos de servicio.</>}</span></label>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn-submit">{english ? 'Submit form' : 'Enviar formulario'}</button>
        </form>
      </section>
    </main>
  );
};

export default RegistroCosmeticLab;
