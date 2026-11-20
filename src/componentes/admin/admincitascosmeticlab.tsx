import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useCosmetic } from '../../context/cosmeticlab';
import {
  crearHorario,
  eliminarHorario,
  listarHorarios,
  actualizarHorario,
} from '../../data/repositorios/horariorepo';
import {
  crearServicio,
  eliminarServicio,
  listarServicios,
  actualizarServicio,
} from '../../data/repositorios/serviciorepo';
import {
  cambiarEstadoCita,
  listarCitasAdmin,
} from '../../data/servicios/citasService';
import type { CitaConDetalle } from '../../data/servicios/citasService';
import type { EstadoHorario, EstadoRegistro, Servicio, Horario } from '../../types/modelos';
import { formatearFecha, formatearMoneda } from '../../utils/formato';

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const servicioVacio = {
  nombre: '',
  descripcion: '',
  precio: '',
  imagen: '',
  duracion: '',
  estado: 'Activo' as EstadoRegistro,
};
const horarioVacio = {
  dia_semana: 'Lunes',
  hora_inicio: '09:00',
  hora_fin: '10:00',
  estado_disponibilidad: 'Disponible' as EstadoHorario,
  estado: 'Activo' as EstadoRegistro,
};

const reportarErrorCarga = (
  error: unknown,
  english: boolean,
  setError: Dispatch<SetStateAction<string>>,
): void => {
  console.error('No se pudo cargar la agenda de administración.', error);
  setError(english ? 'Appointment administration could not be loaded.' : 'No se pudo cargar la administración de citas.');
};

const AdminCitasCosmeticLab = () => {
  const { language } = useCosmetic();
  const english = language === 'en';
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [citas, setCitas] = useState<CitaConDetalle[]>([]);
  const [servicioForm, setServicioForm] = useState(servicioVacio);
  const [horarioForm, setHorarioForm] = useState(horarioVacio);
  const [editandoServicio, setEditandoServicio] = useState<number | null>(null);
  const [editandoHorario, setEditandoHorario] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(async () => {
    const [serviciosActuales, horariosActuales, citasActuales] = await Promise.all([
      listarServicios(),
      listarHorarios(),
      listarCitasAdmin(),
    ]);
    setServicios(serviciosActuales);
    setHorarios(horariosActuales);
    setCitas(citasActuales);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([listarServicios(), listarHorarios(), listarCitasAdmin()])
      .then(([serviciosActuales, horariosActuales, citasActuales]) => {
        if (!active) return;
        setServicios(serviciosActuales);
        setHorarios(horariosActuales);
        setCitas(citasActuales);
      })
      .catch((loadError: unknown) => {
        if (active) reportarErrorCarga(loadError, english, setError);
      });
    return () => {
      active = false;
    };
  }, [cargar, english]);

  const limpiarServicio = () => {
    setEditandoServicio(null);
    setServicioForm(servicioVacio);
  };
  const limpiarHorario = () => {
    setEditandoHorario(null);
    setHorarioForm(horarioVacio);
  };
  const reportar = (errorOperacion: unknown, accion: string) => {
    console.error(accion, errorOperacion);
    setError(errorOperacion instanceof Error
      ? errorOperacion.message
      : (english ? 'The operation could not be completed.' : 'No se pudo completar la operación.'));
  };

  const guardarServicio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    const precio = Number(servicioForm.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      setError(english ? 'Enter a valid non-negative price.' : 'Ingresa un precio válido mayor o igual a cero.');
      return;
    }
    try {
      const datos = {
        ...servicioForm,
        nombre: servicioForm.nombre.trim(),
        descripcion: servicioForm.descripcion.trim(),
        precio,
        imagen: servicioForm.imagen.trim(),
        duracion: servicioForm.duracion.trim(),
      };
      if (editandoServicio === null) await crearServicio(datos);
      else await actualizarServicio(editandoServicio, datos);
      await cargar();
      limpiarServicio();
      setMensaje(english ? 'Service saved.' : 'Servicio guardado.');
    } catch (saveError) {
      reportar(saveError, 'No se pudo guardar el servicio.');
    }
  };

  const guardarHorario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    try {
      const datos = {
        ...horarioForm,
        hora_inicio: `${horarioForm.hora_inicio}:00`,
        hora_fin: `${horarioForm.hora_fin}:00`,
      };
      if (editandoHorario === null) await crearHorario(datos);
      else await actualizarHorario(editandoHorario, datos);
      await cargar();
      limpiarHorario();
      setMensaje(english ? 'Schedule saved.' : 'Horario guardado.');
    } catch (saveError) {
      reportar(saveError, 'No se pudo guardar el horario.');
    }
  };

  const eliminar = async (tipo: 'servicio' | 'horario', id: number) => {
    setError('');
    setMensaje('');
    try {
      if (tipo === 'servicio') await eliminarServicio(id);
      else await eliminarHorario(id);
      await cargar();
    } catch (deleteError) {
      reportar(deleteError, 'No se pudo eliminar el registro.');
    }
  };

  const actualizarEstadoCita = async (id: number) => {
    setError('');
    setMensaje('');
    try {
      await cambiarEstadoCita(id, 'Cancelada');
      await cargar();
      setMensaje(english ? 'Appointment cancelled.' : 'Cita cancelada.');
    } catch (statusError) {
      reportar(statusError, 'No se pudo cancelar la cita.');
    }
  };

  const citasFiltradas = citas
    .filter((cita) => filtroEstado === 'Todas' || cita.estado === filtroEstado)
    .filter((cita) => !filtroFecha || cita.fecha === filtroFecha);

  return (
    <div className="appointment-admin">
      <h2>{english ? 'Services, schedules and appointments' : 'Servicios, horarios y citas'}</h2>
      {error && <p className="error-message" role="alert">{error}</p>}
      {mensaje && <p className="success-message" role="status">{mensaje}</p>}

      <section className="appointment-admin-section">
        <h3>{english ? 'Services' : 'Servicios'}</h3>
        <form className="catalog-admin-form" onSubmit={(event) => void guardarServicio(event)}>
          <h3>{editandoServicio === null
            ? (english ? 'Add service' : 'Agregar servicio')
            : (english ? 'Edit service' : 'Editar servicio')}</h3>
          <label>{english ? 'Name' : 'Nombre'}
            <input maxLength={150} value={servicioForm.nombre} onChange={(event) => setServicioForm({ ...servicioForm, nombre: event.target.value })} required />
          </label>
          <label>{english ? 'Price (COP)' : 'Precio (COP)'}
            <input type="number" min="0" step="0.01" value={servicioForm.precio} onChange={(event) => setServicioForm({ ...servicioForm, precio: event.target.value })} required />
          </label>
          <label>{english ? 'Duration' : 'Duración'}
            <input maxLength={50} placeholder="60 minutos" value={servicioForm.duracion} onChange={(event) => setServicioForm({ ...servicioForm, duracion: event.target.value })} required />
          </label>
          <label>{english ? 'Status' : 'Estado'}
            <select value={servicioForm.estado} onChange={(event) => setServicioForm({ ...servicioForm, estado: event.target.value as EstadoRegistro })}>
              <option value="Activo">{english ? 'Active' : 'Activo'}</option>
              <option value="Inactivo">{english ? 'Inactive' : 'Inactivo'}</option>
            </select>
          </label>
          <label className="appointment-full">{english ? 'Description' : 'Descripción'}
            <textarea rows={3} value={servicioForm.descripcion} onChange={(event) => setServicioForm({ ...servicioForm, descripcion: event.target.value })} required />
          </label>
          <label className="appointment-full">{english ? 'Image path' : 'Ruta de imagen'}
            <input maxLength={255} value={servicioForm.imagen} onChange={(event) => setServicioForm({ ...servicioForm, imagen: event.target.value })} />
          </label>
          <div className="catalog-form-actions appointment-full">
            <button className="btn-submit" type="submit">{english ? 'Save service' : 'Guardar servicio'}</button>
            {editandoServicio !== null && <button className="catalog-cancel" type="button" onClick={limpiarServicio}>{english ? 'Cancel' : 'Cancelar'}</button>}
          </div>
        </form>
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>{english ? 'Name' : 'Nombre'}</th><th>{english ? 'Price' : 'Precio'}</th><th>{english ? 'Duration' : 'Duración'}</th><th>{english ? 'Status' : 'Estado'}</th><th>{english ? 'Actions' : 'Acciones'}</th></tr></thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr key={servicio.id_servicio}>
                  <td>{servicio.id_servicio}</td><td>{servicio.nombre}</td><td>{formatearMoneda(servicio.precio)}</td><td>{servicio.duracion}</td><td>{servicio.estado}</td>
                  <td className="catalog-table-actions">
                    <button type="button" onClick={() => {
                      setEditandoServicio(servicio.id_servicio);
                      setServicioForm({
                        nombre: servicio.nombre,
                        descripcion: servicio.descripcion,
                        precio: String(servicio.precio),
                        imagen: servicio.imagen,
                        duracion: servicio.duracion,
                        estado: servicio.estado,
                      });
                    }}>{english ? 'Edit' : 'Editar'}</button>
                    <button type="button" onClick={() => void eliminar('servicio', servicio.id_servicio)}>{english ? 'Delete' : 'Eliminar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {servicios.length === 0 && <p>{english ? 'No services configured.' : 'No hay servicios configurados.'}</p>}
        </div>
      </section>

      <section className="appointment-admin-section">
        <h3>{english ? 'Schedules' : 'Horarios'}</h3>
        <form className="catalog-admin-form" onSubmit={(event) => void guardarHorario(event)}>
          <h3>{editandoHorario === null
            ? (english ? 'Add schedule block' : 'Agregar bloque horario')
            : (english ? 'Edit schedule block' : 'Editar bloque horario')}</h3>
          <label>{english ? 'Weekday' : 'Día de la semana'}
            <select value={horarioForm.dia_semana} onChange={(event) => setHorarioForm({ ...horarioForm, dia_semana: event.target.value })}>
              {dias.map((dia) => <option key={dia} value={dia}>{dia}</option>)}
            </select>
          </label>
          <label>{english ? 'Start time' : 'Hora de inicio'}
            <input type="time" value={horarioForm.hora_inicio} onChange={(event) => setHorarioForm({ ...horarioForm, hora_inicio: event.target.value })} required />
          </label>
          <label>{english ? 'End time' : 'Hora de fin'}
            <input type="time" value={horarioForm.hora_fin} onChange={(event) => setHorarioForm({ ...horarioForm, hora_fin: event.target.value })} required />
          </label>
          <label>{english ? 'Availability' : 'Disponibilidad'}
            <select value={horarioForm.estado_disponibilidad} onChange={(event) => setHorarioForm({ ...horarioForm, estado_disponibilidad: event.target.value as EstadoHorario })}>
              <option value="Disponible">{english ? 'Available' : 'Disponible'}</option>
              <option value="Ocupado">{english ? 'Occupied' : 'Ocupado'}</option>
            </select>
          </label>
          <label>{english ? 'Status' : 'Estado del bloque'}
            <select value={horarioForm.estado} onChange={(event) => setHorarioForm({ ...horarioForm, estado: event.target.value as EstadoRegistro })}>
              <option value="Activo">{english ? 'Active' : 'Activo'}</option>
              <option value="Inactivo">{english ? 'Inactive' : 'Inactivo'}</option>
            </select>
          </label>
          <div className="catalog-form-actions appointment-full">
            <button className="btn-submit" type="submit">{english ? 'Save schedule' : 'Guardar horario'}</button>
            {editandoHorario !== null && <button className="catalog-cancel" type="button" onClick={limpiarHorario}>{english ? 'Cancel' : 'Cancelar'}</button>}
          </div>
        </form>
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>{english ? 'Weekday' : 'Día'}</th><th>{english ? 'Time' : 'Horario'}</th><th>{english ? 'Availability' : 'Disponibilidad'}</th><th>{english ? 'Status' : 'Estado'}</th><th>{english ? 'Actions' : 'Acciones'}</th></tr></thead>
            <tbody>
              {horarios.map((horario) => (
                <tr key={horario.id_horario}>
                  <td>{horario.id_horario}</td><td>{horario.dia_semana}</td><td>{horario.hora_inicio.slice(0, 5)} – {horario.hora_fin.slice(0, 5)}</td><td>{horario.estado_disponibilidad}</td><td>{horario.estado}</td>
                  <td className="catalog-table-actions">
                    <button type="button" onClick={() => {
                      setEditandoHorario(horario.id_horario);
                      setHorarioForm({
                        dia_semana: horario.dia_semana,
                        hora_inicio: horario.hora_inicio.slice(0, 5),
                        hora_fin: horario.hora_fin.slice(0, 5),
                        estado_disponibilidad: horario.estado_disponibilidad,
                        estado: horario.estado,
                      });
                    }}>{english ? 'Edit' : 'Editar'}</button>
                    <button type="button" onClick={() => void eliminar('horario', horario.id_horario)}>{english ? 'Delete' : 'Eliminar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {horarios.length === 0 && <p>{english ? 'No schedules configured.' : 'No hay horarios configurados.'}</p>}
        </div>
      </section>

      <section className="appointment-admin-section">
        <h3>{english ? 'Booked appointments' : 'Citas agendadas'}</h3>
        <div className="appointment-filters">
          <label>{english ? 'Status' : 'Estado'}
            <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
              <option value="Todas">{english ? 'All' : 'Todas'}</option>
              <option value="Programada">Programada</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </label>
          <label>{english ? 'Date' : 'Fecha'}
            <input type="date" value={filtroFecha} onChange={(event) => setFiltroFecha(event.target.value)} />
          </label>
        </div>
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>{english ? 'Customer' : 'Cliente'}</th><th>{english ? 'Service' : 'Servicio'}</th><th>{english ? 'Date' : 'Fecha'}</th><th>{english ? 'Time' : 'Hora'}</th><th>{english ? 'Location' : 'Sede'}</th><th>{english ? 'Total' : 'Total'}</th><th>{english ? 'Status' : 'Estado'}</th><th>{english ? 'Actions' : 'Acciones'}</th></tr></thead>
            <tbody>
              {citasFiltradas.map((cita) => (
                <tr key={cita.id_cita}>
                  <td>{cita.id_cita}</td><td>{cita.usuario_nombre}</td><td>{cita.servicio_nombre}</td><td>{formatearFecha(cita.fecha, english ? 'en' : 'es')}</td><td>{cita.hora_inicio.slice(0, 5)} – {cita.hora_fin.slice(0, 5)}</td><td>{cita.ubicacion}</td><td>{formatearMoneda(cita.total)}</td><td>{cita.estado}</td>
                  <td>{cita.estado === 'Programada' && <button className="panel-delete" type="button" onClick={() => void actualizarEstadoCita(cita.id_cita)}>{english ? 'Cancel' : 'Cancelar'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {citasFiltradas.length === 0 && <p>{english ? 'No appointments match these filters.' : 'No hay citas con esos filtros.'}</p>}
        </div>
      </section>
    </div>
  );
};

export default AdminCitasCosmeticLab;
