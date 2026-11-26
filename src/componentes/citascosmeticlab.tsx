import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/authcosmeticlab';
import { useCosmetic } from '../context/cosmeticlab';
import {
  agendarCita,
  listarCitasDeUsuario,
  listarServiciosDisponibles,
  obtenerHorariosDisponibles,
} from '../data/servicios/citasService';
import { listarMaquilladorasActivas } from '../data/repositorios/maquilladorarepo';
import type { CitaConDetalle } from '../data/servicios/citasService';
import type { Horario, Maquilladora, Servicio } from '../types/modelos';
import { formatearFecha, formatearMoneda } from '../utils/formato';
import ImagenProducto from './imagenproductocosmeticlab';
import '../estilos/citas.css';

const fechaLocal = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
};

const CitasCosmeticLab = () => {
  const { currentUser } = useAuth();
  const { language } = useCosmetic();
  const english = language === 'en';
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [maquilladoras, setMaquilladoras] = useState<Maquilladora[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [citas, setCitas] = useState<CitaConDetalle[]>([]);
  const [idServicio, setIdServicio] = useState('');
  const [idMaquilladora, setIdMaquilladora] = useState('');
  const [fecha, setFecha] = useState('');
  const [idHorario, setIdHorario] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const servicioSeleccionado = useMemo(
    () => servicios.find((servicio) => servicio.id_servicio === Number(idServicio)),
    [servicios, idServicio],
  );
  const maquilladoraSeleccionada = useMemo(
    () => maquilladoras.find((maquilladora) => (
      maquilladora.id_maquilladora === Number(idMaquilladora)
    )),
    [maquilladoras, idMaquilladora],
  );

  useEffect(() => {
    let active = true;
    if (!currentUser) return undefined;
    void Promise.all([
      listarServiciosDisponibles(),
      listarMaquilladorasActivas(),
      listarCitasDeUsuario(currentUser.id),
    ])
      .then(([serviciosActuales, maquilladorasActuales, citasActuales]) => {
        if (!active) return;
        setServicios(serviciosActuales);
        setMaquilladoras(maquilladorasActuales);
        setCitas(citasActuales);
      })
      .catch((loadError: unknown) => {
        console.error('No se pudieron cargar los datos de agendamiento.', loadError);
        if (active) setError(english ? 'Appointment data could not be loaded.' : 'No se pudieron cargar los datos de citas.');
      })
      .finally(() => {
        if (active) setCargando(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser, english]);

  useEffect(() => {
    let active = true;
    if (!idServicio || !idMaquilladora || !fecha) return undefined;
    void obtenerHorariosDisponibles(Number(idServicio), fecha, Number(idMaquilladora))
      .then((horariosDisponibles) => {
        if (active) {
          setHorarios(horariosDisponibles);
          setIdHorario('');
        }
      })
      .catch((scheduleError: unknown) => {
        console.error('No se pudieron consultar los horarios disponibles.', scheduleError);
        if (active) {
          setHorarios([]);
          setIdHorario('');
          setError(scheduleError instanceof Error
            ? scheduleError.message
            : (english ? 'Available times could not be loaded.' : 'No se pudieron consultar los horarios.'));
        }
      })
      .finally(() => {
        if (active) setCargandoHorarios(false);
      });
    return () => {
      active = false;
    };
  }, [idServicio, idMaquilladora, fecha, english]);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (!currentUser) {
      setError(english ? 'Sign in before booking an appointment.' : 'Inicia sesión antes de agendar una cita.');
      return;
    }
    if (!idServicio || !idMaquilladora || !fecha || !idHorario || cargandoHorarios) {
      setError(english
        ? 'Choose a service, makeup artist, date and available time.'
        : 'Selecciona un servicio, maquilladora, fecha y horario disponible.');
      return;
    }
    setEnviando(true);
    try {
      await agendarCita({
        id_usuario: currentUser.id,
        id_servicio: Number(idServicio),
        id_maquilladora: Number(idMaquilladora),
        id_horario: Number(idHorario),
        fecha,
        cantidad_personas: Number(cantidad),
        ubicacion,
        observaciones,
      });
      setIdHorario('');
      setMensaje(english ? 'Your appointment has been confirmed.' : 'Tu cita quedó confirmada.');
      try {
        const [citasActualizadas, horariosActualizados] = await Promise.all([
          listarCitasDeUsuario(currentUser.id),
          obtenerHorariosDisponibles(Number(idServicio), fecha, Number(idMaquilladora)),
        ]);
        setCitas(citasActualizadas);
        setHorarios(horariosActualizados);
      } catch (refreshError) {
        console.error('La cita se confirmó, pero no se pudieron actualizar los datos visibles.', refreshError);
        setError(english
          ? 'The appointment was booked, but the latest data could not be refreshed.'
          : 'La cita quedó confirmada, pero no se pudo actualizar la información. Recarga la página para ver los cambios.');
      }
    } catch (bookingError) {
      console.error('No se pudo confirmar la cita.', bookingError);
      setError(bookingError instanceof Error
        ? bookingError.message
        : (english ? 'The appointment could not be confirmed.' : 'No se pudo confirmar la cita.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="appointment-page">
      <header className="appointment-heading">
        <span className="section-kicker">CosmeticLAB</span>
        <h1>{english ? 'Book an appointment' : 'Agenda tu cita'}</h1>
        <p>{english
          ? 'Choose a service, date and available time for your visit.'
          : 'Elige el servicio, fecha y horario disponible para tu visita.'}</p>
      </header>

      <section className="appointment-booking">
        <form className="catalog-admin-form appointment-form" onSubmit={(event) => void enviar(event)}>
          <h2>{english ? 'Appointment details' : 'Datos de la cita'}</h2>
          <label>
            {english ? 'Service' : 'Servicio'}
            <select value={idServicio} onChange={(event) => {
              const nuevoServicio = event.target.value;
              setIdServicio(nuevoServicio);
              setHorarios([]);
              setIdHorario('');
              setCargandoHorarios(Boolean(nuevoServicio && fecha && idMaquilladora));
              setError('');
            }} required>
              <option value="">{english ? 'Choose a service' : 'Selecciona un servicio'}</option>
              {servicios.map((servicio) => (
                <option key={servicio.id_servicio} value={servicio.id_servicio}>
                  {servicio.nombre} — {formatearMoneda(servicio.precio)} · {servicio.duracion}
                </option>
              ))}
            </select>
          </label>
          <label>
            {english ? 'Makeup artist' : 'Maquilladora'}
            <select
              value={idMaquilladora}
              onChange={(event) => {
                const nuevaMaquilladora = event.target.value;
                setIdMaquilladora(nuevaMaquilladora);
                setHorarios([]);
                setIdHorario('');
                setCargandoHorarios(Boolean(idServicio && fecha && nuevaMaquilladora));
                setError('');
              }}
              required
              disabled={maquilladoras.length === 0}
            >
              <option value="">{english ? 'Choose a makeup artist' : 'Selecciona una maquilladora'}</option>
              {maquilladoras.map((maquilladora) => (
                <option key={maquilladora.id_maquilladora} value={maquilladora.id_maquilladora}>
                  {maquilladora.nombre}
                </option>
              ))}
            </select>
          </label>
          {maquilladoraSeleccionada && (
            <div className="appointment-artist appointment-full">
              <ImagenProducto
                key={maquilladoraSeleccionada.imagen}
                src={maquilladoraSeleccionada.imagen}
                alt={maquilladoraSeleccionada.nombre}
              />
              <span>{maquilladoraSeleccionada.nombre}</span>
            </div>
          )}
          <label>
            {english ? 'Date' : 'Fecha'}
            <input type="date" min={fechaLocal()} value={fecha} onChange={(event) => {
              const nuevaFecha = event.target.value;
              setFecha(nuevaFecha);
              setHorarios([]);
              setIdHorario('');
              setCargandoHorarios(Boolean(idServicio && nuevaFecha && idMaquilladora));
              setError('');
            }} required />
          </label>
          <label>
            {english ? 'Available time' : 'Horario disponible'}
            <select
              value={idHorario}
              onChange={(event) => setIdHorario(event.target.value)}
              required
              disabled={!fecha || !idServicio || !idMaquilladora || cargandoHorarios || horarios.length === 0}
            >
              <option value="">
                {cargandoHorarios
                  ? (english ? 'Loading times...' : 'Consultando horarios...')
                  : (english ? 'Choose a time' : 'Selecciona un horario')}
              </option>
              {horarios.map((horario) => (
                <option key={horario.id_horario} value={horario.id_horario}>
                  {horario.hora_inicio.slice(0, 5)} – {horario.hora_fin.slice(0, 5)}
                </option>
              ))}
            </select>
            {fecha && idServicio && idMaquilladora && !cargandoHorarios && horarios.length === 0 && (
              <small>{english
                ? 'No times are available for this makeup artist, service and date. Contact the administrator if you expected availability.'
                : 'No hay horarios disponibles para esta maquilladora, servicio y fecha. Contacta al administrador si esperabas disponibilidad.'}</small>
            )}
          </label>
          <label>
            {english ? 'People' : 'Personas'}
            <input
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(event) => setCantidad(event.target.value)}
              required
            />
          </label>
          <label>
            {english ? 'Home address (Bogotá)' : 'Dirección del domicilio (Bogotá)'}
            <input
              maxLength={255}
              value={ubicacion}
              onChange={(event) => setUbicacion(event.target.value)}
              placeholder={english ? 'Street, number and neighborhood' : 'Dirección, número y barrio'}
              required
            />
          </label>
          <label className="appointment-full">
            {english ? 'Notes (optional)' : 'Observaciones (opcional)'}
            <textarea maxLength={2000} rows={3} value={observaciones} onChange={(event) => setObservaciones(event.target.value)} />
          </label>
          {servicioSeleccionado && (
            <p className="appointment-total">
              {english ? 'Estimated total' : 'Total estimado'}:{' '}
              <strong>{formatearMoneda(servicioSeleccionado.precio * Math.max(1, Number(cantidad) || 1))}</strong>
            </p>
          )}
          <div className="catalog-form-actions appointment-full">
            <button
              className="btn-submit"
              type="submit"
              disabled={cargando || enviando || servicios.length === 0 || maquilladoras.length === 0}
            >
              {enviando
                ? (english ? 'Booking...' : 'Agendando...')
                : (english ? 'Confirm appointment' : 'Confirmar cita')}
            </button>
          </div>
        </form>

        {error && <p className="error-message" role="alert">{error}</p>}
        {mensaje && <p className="success-message" role="status">{mensaje}</p>}
        {!cargando && servicios.length === 0 && (
          <p className="appointment-empty">
            {english
              ? 'There are no active services yet. Please contact the administrator.'
              : 'Aún no hay servicios activos. Por favor, contacta al administrador.'}
          </p>
        )}
        {!cargando && maquilladoras.length === 0 && (
          <p className="appointment-empty">
            {english
              ? 'There are no active makeup artists. Please contact the administrator.'
              : 'No hay maquilladoras activas. Por favor, contacta al administrador.'}
          </p>
        )}
      </section>

      <section className="appointment-history">
        <h2>{english ? 'My appointments' : 'Mis citas'}</h2>
        {cargando ? (
          <p>{english ? 'Loading appointments...' : 'Cargando citas...'}</p>
        ) : citas.length === 0 ? (
          <p>{english ? 'You have no appointments yet.' : 'Todavía no tienes citas agendadas.'}</p>
        ) : (
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>{english ? 'Service' : 'Servicio'}</th>
                  <th>{english ? 'Makeup artist' : 'Maquilladora'}</th>
                  <th>{english ? 'Date' : 'Fecha'}</th>
                  <th>{english ? 'Time' : 'Hora'}</th>
                  <th>{english ? 'Home address' : 'Dirección del domicilio'}</th>
                  <th>{english ? 'Total' : 'Total'}</th>
                  <th>{english ? 'Status' : 'Estado'}</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.id_cita}>
                    <td>{cita.servicio_nombre}</td>
                    <td>{cita.maquilladora_nombre}</td>
                    <td>{formatearFecha(cita.fecha, english ? 'en' : 'es')}</td>
                    <td>{cita.hora_inicio.slice(0, 5)} – {cita.hora_fin.slice(0, 5)}</td>
                    <td>{cita.ubicacion}</td>
                    <td>{formatearMoneda(cita.total)}</td>
                    <td>{english
                      ? (cita.estado === 'Programada' ? 'Scheduled' : cita.estado === 'Completada' ? 'Completed' : 'Cancelled')
                      : cita.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default CitasCosmeticLab;
