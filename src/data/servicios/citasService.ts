import { leerTabla, siguienteId, escribirTablasAtomico } from '../almacen';
import { listarDetallesCita } from '../repositorios/detallecitarepo';
import { listarCitas } from '../repositorios/citarepo';
import { listarHorarios } from '../repositorios/horariorepo';
import { listarServicios } from '../repositorios/serviciorepo';
import { listarUsuarios } from '../repositorios/usuariorepo';
import type { Cita, DetalleCita, Horario, RegisteredUser, Servicio } from '../../types/modelos';
import { ahoraSQL } from '../../utils/formato';

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const fechaHoyLocal = (): string => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
};

export interface DatosAgendarCita {
  id_usuario: number;
  id_servicio: number;
  id_horario: number;
  fecha: string;
  cantidad_personas: number;
  ubicacion: string;
  observaciones?: string;
}

export interface CitaConDetalle extends Cita {
  servicio_nombre: string;
  usuario_nombre: string;
}

const convertirHoraAMinutos = (hora: string): number => {
  const coincidencia = /^(\d{2}):(\d{2}):(\d{2})$/.exec(hora);
  if (!coincidencia) {
    throw new Error(`La hora "${hora}" guardada no tiene un formato válido.`);
  }
  const [, horas, minutos, segundos] = coincidencia;
  if (Number(horas) > 23 || Number(minutos) > 59 || Number(segundos) > 59) {
    throw new Error(`La hora "${hora}" guardada está fuera de rango.`);
  }
  return Number(horas) * 60 + Number(minutos);
};

const duracionEnMinutos = (duracion: string): number => {
  const coincidencia = /^(\d+)\s*(minutos?|mins?|m|horas?|hrs?|h)?$/i.exec(duracion.trim());
  if (!coincidencia) {
    throw new Error(`La duración "${duracion}" no es válida. Usa, por ejemplo, "60 minutos".`);
  }
  const cantidad = Number(coincidencia[1]);
  const unidad = (coincidencia[2] ?? 'minutos').toLocaleLowerCase();
  const resultado = unidad === 'h' || unidad.startsWith('hora') || unidad.startsWith('hr')
    ? cantidad * 60
    : cantidad;
  if (!Number.isSafeInteger(resultado) || resultado <= 0) {
    throw new Error('La duración del servicio debe ser un número de minutos mayor que cero.');
  }
  return resultado;
};

const validarFecha = (fecha: string): Date => {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!coincidencia) {
    throw new Error('Selecciona una fecha válida en formato YYYY-MM-DD.');
  }
  const [, anio, mes, dia] = coincidencia;
  const fechaUtc = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  if (
    fechaUtc.getUTCFullYear() !== Number(anio)
    || fechaUtc.getUTCMonth() !== Number(mes) - 1
    || fechaUtc.getUTCDate() !== Number(dia)
  ) {
    throw new Error('La fecha seleccionada no existe.');
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fechaUtc.getTime() < Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) {
    throw new Error('No se puede agendar una cita en una fecha pasada.');
  }
  return fechaUtc;
};

const inicioFinCita = (horario: Horario, servicio: Servicio): { inicio: number; fin: number } => {
  const inicio = convertirHoraAMinutos(horario.hora_inicio);
  const fin = inicio + duracionEnMinutos(servicio.duracion);
  if (fin > convertirHoraAMinutos(horario.hora_fin)) {
    throw new Error('La duración del servicio no cabe dentro del bloque horario seleccionado.');
  }
  return { inicio, fin };
};

const horaDesdeMinutos = (minutos: number): string => (
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}:00`
);

const validarSinSolapamiento = (
  citas: readonly Cita[],
  fecha: string,
  horaInicio: string,
  horaFin: string,
): void => {
  const inicio = convertirHoraAMinutos(horaInicio);
  const fin = convertirHoraAMinutos(horaFin);
  const solapada = citas.some((cita) => (
    cita.fecha === fecha
    && cita.estado === 'Programada'
    && inicio < convertirHoraAMinutos(cita.hora_fin)
    && convertirHoraAMinutos(cita.hora_inicio) < fin
  ));
  if (solapada) {
    throw new Error('Ese horario acaba de ser reservado. Selecciona otro bloque disponible.');
  }
};

export const listarServiciosDisponibles = async (): Promise<Servicio[]> => (
  (await listarServicios()).filter((servicio) => servicio.estado === 'Activo')
);

export const obtenerHorariosDisponibles = async (
  idServicio: number,
  fecha: string,
): Promise<Horario[]> => {
  const fechaValidada = validarFecha(fecha);
  const [servicios, horarios, citas] = await Promise.all([
    listarServicios(),
    listarHorarios(),
    listarCitas(),
  ]);
  const servicio = servicios.find((fila) => fila.id_servicio === idServicio && fila.estado === 'Activo');
  if (!servicio) {
    throw new Error('El servicio seleccionado no está disponible.');
  }
  const dia = DIAS_SEMANA[fechaValidada.getUTCDay()];

  return horarios.filter((horario) => {
    if (
      horario.estado !== 'Activo'
      || horario.estado_disponibilidad !== 'Disponible'
      || horario.dia_semana.trim().toLocaleLowerCase() !== dia
    ) {
      return false;
    }

    try {
      const { inicio, fin } = inicioFinCita(horario, servicio);
      const ahora = new Date();
      if (fecha === fechaHoyLocal() && inicio <= ahora.getHours() * 60 + ahora.getMinutes()) {
        return false;
      }
      return !citas.some((cita) => (
        cita.fecha === fecha
        && cita.estado === 'Programada'
        && inicio < convertirHoraAMinutos(cita.hora_fin)
        && convertirHoraAMinutos(cita.hora_inicio) < fin
      ));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('La duración del servicio no cabe')) {
        return false;
      }
      throw error;
    }
  });
};

export const agendarCita = async (datos: DatosAgendarCita): Promise<Cita> => {
  const fecha = validarFecha(datos.fecha);
  const cantidadPersonas = datos.cantidad_personas;
  if (!Number.isSafeInteger(cantidadPersonas) || cantidadPersonas < 1) {
    throw new Error('La cantidad de personas debe ser un entero mayor que cero.');
  }
  const ubicacion = datos.ubicacion.trim();
  if (!ubicacion || ubicacion.length > 255) {
    throw new Error('Selecciona una ubicación válida de máximo 255 caracteres.');
  }
  if (fecha.toISOString().slice(0, 10) !== datos.fecha) {
    throw new Error('La fecha seleccionada no es válida.');
  }

  const [servicios, horarios, citas, detalles] = await Promise.all([
    listarServicios(),
    listarHorarios(),
    listarCitas(),
    listarDetallesCita(),
  ]);
  const servicio = servicios.find((fila) => fila.id_servicio === datos.id_servicio);
  if (!servicio || servicio.estado !== 'Activo') {
    throw new Error('El servicio seleccionado ya no está disponible.');
  }
  const horario = horarios.find((fila) => fila.id_horario === datos.id_horario);
  const dia = DIAS_SEMANA[fecha.getUTCDay()];
  if (
    !horario
    || horario.estado !== 'Activo'
    || horario.estado_disponibilidad !== 'Disponible'
    || horario.dia_semana.trim().toLocaleLowerCase() !== dia
  ) {
    throw new Error('El horario seleccionado ya no está disponible para esa fecha.');
  }

  const { inicio, fin } = inicioFinCita(horario, servicio);
  const hoy = new Date();
  if (
    datos.fecha === `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    && inicio <= hoy.getHours() * 60 + hoy.getMinutes()
  ) {
    throw new Error('No se puede reservar un horario que ya pasó.');
  }
  const horaInicio = horaDesdeMinutos(inicio);
  const horaFin = horaDesdeMinutos(fin);
  validarSinSolapamiento(citas, datos.fecha, horaInicio, horaFin);

  const total = servicio.precio * cantidadPersonas;
  if (!Number.isFinite(total)) {
    throw new Error('No fue posible calcular el total de la cita.');
  }
  const cita: Cita = {
    id_cita: siguienteId('Cita', 'id_cita'),
    id_usuario: datos.id_usuario,
    fecha: datos.fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    ubicacion,
    estado: 'Programada',
    observaciones: datos.observaciones?.trim() || null,
    fecha_solicitud: ahoraSQL(),
    id_horario: horario.id_horario,
    total,
    monto_anticipo: null,
    comprobante_anticipo: null,
  };
  const detalle: DetalleCita = {
    id_detalle_cita: siguienteId('DetalleCita', 'id_detalle_cita'),
    id_servicio: servicio.id_servicio,
    id_cita: cita.id_cita,
    cantidad_personas: cantidadPersonas,
    precio_unitario: servicio.precio,
    subtotal: total,
  };

  validarSinSolapamiento(leerTabla<Cita>('Cita'), datos.fecha, horaInicio, horaFin);
  escribirTablasAtomico({
    Cita: [...citas, cita],
    DetalleCita: [...detalles, detalle],
  });
  return cita;
};

const enriquecerCitas = async (citas: Cita[]): Promise<CitaConDetalle[]> => {
  const [detalles, servicios, usuarios] = await Promise.all([
    listarDetallesCita(),
    listarServicios(),
    listarUsuarios(),
  ]);
  return citas.map((cita) => {
    const detalle = detalles.find((fila) => fila.id_cita === cita.id_cita);
    const servicio = servicios.find((fila) => fila.id_servicio === detalle?.id_servicio);
    const usuario = usuarios.find((fila) => fila.id === cita.id_usuario);
    return {
      ...cita,
      servicio_nombre: servicio?.nombre ?? 'Servicio no disponible',
      usuario_nombre: nombreUsuario(usuario),
    };
  });
};

const nombreUsuario = (usuario: RegisteredUser | undefined): string => (
  usuario ? `${usuario.firstName} ${usuario.lastName}`.trim() : 'Usuario desconocido'
);

export const listarCitasAdmin = async (): Promise<CitaConDetalle[]> => (
  enriquecerCitas(await listarCitas())
);

export const listarCitasDeUsuario = async (idUsuario: number): Promise<CitaConDetalle[]> => (
  enriquecerCitas((await listarCitas()).filter((cita) => cita.id_usuario === idUsuario))
);

export const cambiarEstadoCita = async (
  idCita: number,
  estado: 'Cancelada' | 'Completada',
): Promise<Cita> => {
  const citas = await listarCitas();
  const indice = citas.findIndex((cita) => cita.id_cita === idCita);
  if (indice < 0) {
    throw new Error(`No se encontró la cita ${idCita}.`);
  }
  if (citas[indice].estado !== 'Programada') {
    throw new Error('Solo se pueden cambiar citas que estén programadas.');
  }
  const citaActualizada = { ...citas[indice], estado };
  const nuevasCitas = [...citas];
  nuevasCitas[indice] = citaActualizada;
  escribirTablasAtomico({ Cita: nuevasCitas });
  return citaActualizada;
};
