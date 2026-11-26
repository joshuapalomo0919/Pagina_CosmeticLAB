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
  validarDuracionServicio,
} from '../../data/servicios/citasService';
import {
  actualizarMaquilladora,
  crearMaquilladora,
  eliminarMaquilladora,
  listarMaquilladoras,
} from '../../data/repositorios/maquilladorarepo';
import type { CitaConDetalle } from '../../data/servicios/citasService';
import type {
  EstadoHorario,
  EstadoRegistro,
  EstadoServicio,
  Horario,
  Maquilladora,
  Servicio,
} from '../../types/modelos';
import { formatearFecha, formatearMoneda } from '../../utils/formato';
import ImagenProducto from '../imagenproductocosmeticlab';

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const diasEn: Readonly<Record<string, string>> = {
  Lunes: 'Monday',
  Martes: 'Tuesday',
  Miércoles: 'Wednesday',
  Jueves: 'Thursday',
  Viernes: 'Friday',
  Sábado: 'Saturday',
  Domingo: 'Sunday',
};
const servicioVacio = {
  nombre: '',
  descripcion: '',
  precio: '',
  imagen: '',
  duracion: '',
  estado: 'Activo' as EstadoServicio,
};
const maquilladoraVacia = {
  nombre: '',
  imagen: '',
  estado: 'Activo' as EstadoRegistro,
};
const horarioVacio = {
  dia_semana: 'Lunes',
  hora_inicio: '09:00',
  hora_fin: '10:00',
  estado_disponibilidad: 'Disponible' as EstadoHorario,
  estado: 'Activo' as EstadoRegistro,
};
const leerFoto = (archivo: File, english: boolean): Promise<string> => new Promise((resolve, reject) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
    reject(new Error(english ? 'Choose a valid image file.' : 'Selecciona un archivo de imagen válido.'));
    return;
  }
  if (archivo.size > 512 * 1024) {
    reject(new Error(english ? 'The image must be 512 KB or smaller.' : 'La imagen debe pesar 512 KB o menos.'));
    return;
  }

  const lector = new FileReader();
  lector.onload = () => {
    const resultado = lector.result;
    if (typeof resultado !== 'string') {
      reject(new Error(english ? 'The selected image could not be read.' : 'No se pudo leer la imagen seleccionada.'));
      return;
    }

    const imagen = new Image();
    imagen.onload = () => resolve(resultado);
    imagen.onerror = () => reject(new Error(
      english ? 'The selected file is not a readable image.' : 'El archivo seleccionado no es una imagen válida.',
    ));
    imagen.src = resultado;
  };
  lector.onerror = () => reject(new Error(english ? 'The selected image could not be read.' : 'No se pudo leer la imagen seleccionada.'));
  lector.readAsDataURL(archivo);
});

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
  const [activeTab, setActiveTab] = useState<'servicios' | 'horarios' | 'citas'>('servicios');
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [maquilladoras, setMaquilladoras] = useState<Maquilladora[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [citas, setCitas] = useState<CitaConDetalle[]>([]);
  const [servicioForm, setServicioForm] = useState(servicioVacio);
  const [maquilladoraForm, setMaquilladoraForm] = useState(maquilladoraVacia);
  const [horarioForm, setHorarioForm] = useState(horarioVacio);
  const [leyendoFoto, setLeyendoFoto] = useState(false);
  const [editandoMaquilladora, setEditandoMaquilladora] = useState<number | null>(null);
  const [editandoServicio, setEditandoServicio] = useState<number | null>(null);
  const [editandoHorario, setEditandoHorario] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(async () => {
    const [serviciosActuales, maquilladorasActuales, horariosActuales, citasActuales] = await Promise.all([
      listarServicios(),
      listarMaquilladoras(),
      listarHorarios(),
      listarCitasAdmin(),
    ]);
    setServicios(serviciosActuales);
    setMaquilladoras(maquilladorasActuales);
    setHorarios(horariosActuales);
    setCitas(citasActuales);
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listarServicios(),
      listarMaquilladoras(),
      listarHorarios(),
      listarCitasAdmin(),
    ])
      .then(([serviciosActuales, maquilladorasActuales, horariosActuales, citasActuales]) => {
        if (!active) return;
        setServicios(serviciosActuales);
        setMaquilladoras(maquilladorasActuales);
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
  const limpiarMaquilladora = () => {
    setEditandoMaquilladora(null);
    setMaquilladoraForm(maquilladoraVacia);
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
    if (servicioForm.estado === 'Activo') {
      if (precio <= 0) {
        setError(english
          ? 'An active service must have a price greater than zero.'
          : 'Un servicio activo debe tener un precio mayor que cero.');
        return;
      }
      try {
        validarDuracionServicio(servicioForm.duracion);
      } catch (durationError) {
        console.error('La duración del servicio no es válida.', durationError);
        setError(english
          ? 'Enter a valid duration, for example "60 minutes".'
          : (durationError instanceof Error
            ? durationError.message
            : 'Ingresa una duración válida, por ejemplo "60 minutos".'));
        return;
      }
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

  const guardarMaquilladora = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMensaje('');
    if (leyendoFoto) {
      setError(english ? 'Wait for the profile photo to finish loading.' : 'Espera a que termine de cargarse la foto de perfil.');
      return;
    }
    try {
      const datos = {
        ...maquilladoraForm,
        nombre: maquilladoraForm.nombre.trim(),
      };
      if (!datos.nombre) {
        throw new Error(english ? 'Enter the makeup artist name.' : 'Escribe el nombre de la maquilladora.');
      }
      if (editandoMaquilladora === null) await crearMaquilladora(datos);
      else await actualizarMaquilladora(editandoMaquilladora, datos);
      await cargar();
      limpiarMaquilladora();
      setMensaje(english ? 'Makeup artist saved.' : 'Maquilladora guardada.');
    } catch (saveError) {
      reportar(saveError, 'No se pudo guardar la maquilladora.');
    }
  };

  const cambiarEstadoMaquilladora = async (maquilladora: Maquilladora) => {
    setError('');
    setMensaje('');
    try {
      await actualizarMaquilladora(maquilladora.id_maquilladora, {
        estado: maquilladora.estado === 'Activo' ? 'Inactivo' : 'Activo',
      });
      await cargar();
      setMensaje(english ? 'Makeup artist status updated.' : 'Estado de la maquilladora actualizado.');
    } catch (statusError) {
      reportar(statusError, 'No se pudo cambiar el estado de la maquilladora.');
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

  const eliminar = async (tipo: 'servicio' | 'horario' | 'maquilladora', id: number) => {
    setError('');
    setMensaje('');
    try {
      if (tipo === 'servicio') await eliminarServicio(id);
      else if (tipo === 'horario') await eliminarHorario(id);
      else await eliminarMaquilladora(id);
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

      <nav className="appointment-admin-tabs" role="tablist" aria-label={english ? 'Appointment administration' : 'Administración de citas'}>
        <button
          id="appointment-tab-services"
          type="button"
          role="tab"
          aria-selected={activeTab === 'servicios'}
          aria-controls="appointment-panel-services"
          onClick={() => setActiveTab('servicios')}
        >{english ? 'Services' : 'Servicios'}</button>
        <button
          id="appointment-tab-schedules"
          type="button"
          role="tab"
          aria-selected={activeTab === 'horarios'}
          aria-controls="appointment-panel-schedules"
          onClick={() => setActiveTab('horarios')}
        >{english ? 'Schedules' : 'Horarios'}</button>
        <button
          id="appointment-tab-bookings"
          type="button"
          role="tab"
          aria-selected={activeTab === 'citas'}
          aria-controls="appointment-panel-bookings"
          onClick={() => setActiveTab('citas')}
        >{english ? 'Booked appointments' : 'Citas agendadas'}</button>
      </nav>

      {activeTab === 'servicios' && (
        <div id="appointment-panel-services" role="tabpanel" aria-labelledby="appointment-tab-services">
      <section className="appointment-admin-section">
        <h3>{english ? 'Makeup artists' : 'Maquilladoras'}</h3>
        <form className="catalog-admin-form" onSubmit={(event) => void guardarMaquilladora(event)}>
          <h3>{editandoMaquilladora === null
            ? (english ? 'Add makeup artist' : 'Agregar maquilladora')
            : (english ? 'Edit makeup artist' : 'Editar maquilladora')}</h3>
          <label>{english ? 'Name' : 'Nombre'}
            <input
              value={maquilladoraForm.nombre}
              onChange={(event) => setMaquilladoraForm({ ...maquilladoraForm, nombre: event.target.value })}
              required
            />
          </label>
          <label>{english ? 'Profile photo' : 'Foto de perfil'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={leyendoFoto}
              aria-busy={leyendoFoto}
              onChange={(event) => {
                const archivo = event.target.files?.[0];
                if (!archivo) return;
                setLeyendoFoto(true);
                setError('');
                void leerFoto(archivo, english)
                  .then((imagen) => setMaquilladoraForm((actual) => ({ ...actual, imagen })))
                  .catch((photoError: unknown) => reportar(photoError, 'No se pudo cargar la foto.'))
                  .finally(() => setLeyendoFoto(false));
              }}
            />
            <small>{leyendoFoto
              ? (english ? 'Loading photo...' : 'Cargando foto...')
              : (english ? 'JPG, PNG or WebP; up to 512 KB.' : 'JPG, PNG o WebP; máximo 512 KB.')}</small>
          </label>
          {maquilladoraForm.imagen && (
            <div className="appointment-artist-preview">
              <ImagenProducto
                key={maquilladoraForm.imagen}
                src={maquilladoraForm.imagen}
                alt={maquilladoraForm.nombre}
              />
            </div>
          )}
          <label>{english ? 'Status' : 'Estado'}
            <select
              value={maquilladoraForm.estado}
              onChange={(event) => setMaquilladoraForm({
                ...maquilladoraForm,
                estado: event.target.value as EstadoRegistro,
              })}
            >
              <option value="Activo">{english ? 'Active' : 'Activa'}</option>
              <option value="Inactivo">{english ? 'Inactive' : 'Inactiva'}</option>
            </select>
          </label>
          <div className="catalog-form-actions appointment-full">
            <button className="btn-submit" type="submit" disabled={leyendoFoto}>
              {leyendoFoto
                ? (english ? 'Loading photo...' : 'Cargando foto...')
                : (english ? 'Save makeup artist' : 'Guardar maquilladora')}
            </button>
            {editandoMaquilladora !== null && (
              <button className="catalog-cancel" type="button" onClick={limpiarMaquilladora}>
                {english ? 'Cancel' : 'Cancelar'}
              </button>
            )}
          </div>
        </form>
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{english ? 'Photo' : 'Foto'}</th>
                <th>{english ? 'Name' : 'Nombre'}</th>
                <th>{english ? 'Status' : 'Estado'}</th>
                <th>{english ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody>
              {maquilladoras.map((maquilladora) => (
                <tr key={maquilladora.id_maquilladora}>
                  <td>{maquilladora.id_maquilladora}</td>
                  <td>
                    <div className="appointment-artist-table-photo">
                      <ImagenProducto
                        key={maquilladora.imagen}
                        src={maquilladora.imagen}
                        alt={maquilladora.nombre}
                      />
                    </div>
                  </td>
                  <td>{maquilladora.nombre}</td>
                  <td>{english ? (maquilladora.estado === 'Activo' ? 'Active' : 'Inactive') : maquilladora.estado}</td>
                  <td className="catalog-table-actions">
                    <button type="button" onClick={() => {
                      setActiveTab('servicios');
                      setEditandoMaquilladora(maquilladora.id_maquilladora);
                      setMaquilladoraForm({
                        nombre: maquilladora.nombre,
                        imagen: maquilladora.imagen,
                        estado: maquilladora.estado,
                      });
                      setError('');
                      setMensaje('');
                    }}>{english ? 'Edit' : 'Editar'}</button>
                    <button type="button" onClick={() => void cambiarEstadoMaquilladora(maquilladora)}>
                      {maquilladora.estado === 'Activo'
                        ? (english ? 'Deactivate' : 'Desactivar')
                        : (english ? 'Activate' : 'Activar')}
                    </button>
                    <button type="button" onClick={() => void eliminar('maquilladora', maquilladora.id_maquilladora)}>
                      {english ? 'Delete' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {maquilladoras.length === 0 && (
            <p>{english ? 'No makeup artists configured.' : 'No hay maquilladoras configuradas.'}</p>
          )}
        </div>
      </section>

      <section className="appointment-admin-section">
        <h3>{english ? 'Services' : 'Servicios'}</h3>
        <p>{english
          ? 'Moda, Social and Novia start inactive. Add a price and duration, then activate each service to enable bookings.'
          : 'Moda, Social y Novia empiezan inactivos. Agrega precio y duración y activa cada servicio para permitir reservas.'}</p>
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
            <select value={servicioForm.estado} onChange={(event) => setServicioForm({ ...servicioForm, estado: event.target.value as EstadoServicio })}>
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
                  <td>{servicio.id_servicio}</td><td>{servicio.nombre}</td><td>{formatearMoneda(servicio.precio)}</td><td>{servicio.duracion}</td><td>{english ? (servicio.estado === 'Activo' ? 'Active' : 'Inactive') : servicio.estado}</td>
                  <td className="catalog-table-actions">
                    <button type="button" onClick={() => {
                      setActiveTab('servicios');
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
        </div>
      )}

      {activeTab === 'horarios' && (
        <div id="appointment-panel-schedules" role="tabpanel" aria-labelledby="appointment-tab-schedules">
      <section className="appointment-admin-section">
        <h3>{english ? 'Schedules' : 'Horarios'}</h3>
        <form id="appointment-schedule-form" className="catalog-admin-form" onSubmit={(event) => void guardarHorario(event)}>
          <h3>{editandoHorario === null
            ? (english ? 'Add schedule block' : 'Agregar bloque horario')
            : (english ? 'Edit schedule block' : 'Editar bloque horario')}</h3>
          <label>{english ? 'Weekday' : 'Día de la semana'}
            <select value={horarioForm.dia_semana} onChange={(event) => setHorarioForm({ ...horarioForm, dia_semana: event.target.value })}>
              {dias.map((dia) => <option key={dia} value={dia}>{english ? diasEn[dia] : dia}</option>)}
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
                  <td>{horario.id_horario}</td><td>{english ? (diasEn[horario.dia_semana] ?? horario.dia_semana) : horario.dia_semana}</td><td>{horario.hora_inicio.slice(0, 5)} – {horario.hora_fin.slice(0, 5)}</td><td>{english ? (horario.estado_disponibilidad === 'Disponible' ? 'Available' : 'Occupied') : horario.estado_disponibilidad}</td><td>{english ? (horario.estado === 'Activo' ? 'Active' : 'Inactive') : horario.estado}</td>
                  <td className="catalog-table-actions">
                    <button type="button" onClick={() => {
                      setActiveTab('horarios');
                      setEditandoHorario(horario.id_horario);
                      setHorarioForm({
                        dia_semana: horario.dia_semana,
                        hora_inicio: horario.hora_inicio.slice(0, 5),
                        hora_fin: horario.hora_fin.slice(0, 5),
                        estado_disponibilidad: horario.estado_disponibilidad,
                        estado: horario.estado,
                      });
                      setError('');
                      setMensaje('');
                      window.requestAnimationFrame(() => {
                        document.getElementById('appointment-schedule-form')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
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
        </div>
      )}

      {activeTab === 'citas' && (
        <div id="appointment-panel-bookings" role="tabpanel" aria-labelledby="appointment-tab-bookings">
      <section className="appointment-admin-section">
        <h3>{english ? 'Booked appointments' : 'Citas agendadas'}</h3>
        <div className="appointment-filters">
          <label>{english ? 'Status' : 'Estado'}
            <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value)}>
              <option value="Todas">{english ? 'All' : 'Todas'}</option>
              <option value="Programada">{english ? 'Scheduled' : 'Programada'}</option>
              <option value="Completada">{english ? 'Completed' : 'Completada'}</option>
              <option value="Cancelada">{english ? 'Cancelled' : 'Cancelada'}</option>
            </select>
          </label>
          <label>{english ? 'Date' : 'Fecha'}
            <input type="date" value={filtroFecha} onChange={(event) => setFiltroFecha(event.target.value)} />
          </label>
        </div>
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>{english ? 'Customer' : 'Cliente'}</th><th>{english ? 'Service' : 'Servicio'}</th><th>{english ? 'Makeup artist' : 'Maquilladora'}</th><th>{english ? 'Date' : 'Fecha'}</th><th>{english ? 'Time' : 'Hora'}</th><th>{english ? 'Home address' : 'Dirección del domicilio'}</th><th>{english ? 'Total' : 'Total'}</th><th>{english ? 'Status' : 'Estado'}</th><th>{english ? 'Actions' : 'Acciones'}</th></tr></thead>
            <tbody>
              {citasFiltradas.map((cita) => (
                <tr key={cita.id_cita}>
                  <td>{cita.id_cita}</td><td>{cita.usuario_nombre}</td><td>{cita.servicio_nombre}</td><td>{cita.maquilladora_nombre}</td><td>{formatearFecha(cita.fecha, english ? 'en' : 'es')}</td><td>{cita.hora_inicio.slice(0, 5)} – {cita.hora_fin.slice(0, 5)}</td><td>{cita.ubicacion}</td><td>{formatearMoneda(cita.total)}</td><td>{english ? (cita.estado === 'Programada' ? 'Scheduled' : cita.estado === 'Completada' ? 'Completed' : 'Cancelled') : cita.estado}</td>
                  <td>{cita.estado === 'Programada' && <button className="panel-delete" type="button" onClick={() => void actualizarEstadoCita(cita.id_cita)}>{english ? 'Cancel' : 'Cancelar'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {citasFiltradas.length === 0 && <p>{english ? 'No appointments match these filters.' : 'No hay citas con esos filtros.'}</p>}
        </div>
      </section>
        </div>
      )}
    </div>
  );
};

export default AdminCitasCosmeticLab;
