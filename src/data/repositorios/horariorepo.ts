import { leerTabla } from '../almacen';
import type { Horario } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<Horario, 'id_horario'>(
  'Horario',
  'id_horario',
  { dependientes: [{ tabla: 'Cita', campo: 'id_horario' }] },
);

const minutos = (hora: string): number => {
  const coincidencia = /^(\d{2}):(\d{2}):(\d{2})$/.exec(hora);
  if (!coincidencia) {
    throw new Error(`La hora "${hora}" no tiene el formato HH:mm:ss.`);
  }
  const [, horas, minutosHora, segundos] = coincidencia;
  const total = Number(horas) * 60 + Number(minutosHora);
  if (Number(horas) > 23 || Number(minutosHora) > 59 || Number(segundos) > 59) {
    throw new Error(`La hora "${hora}" no es válida.`);
  }
  return total;
};

const validarHorario = (horario: Omit<Horario, 'id_horario'>, idIgnorado?: number): void => {
  const inicio = minutos(horario.hora_inicio);
  const fin = minutos(horario.hora_fin);
  if (inicio >= fin) {
    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const haySolapamiento = leerTabla<Horario>('Horario').some((existente) => (
    existente.id_horario !== idIgnorado
    && existente.dia_semana.toLocaleLowerCase() === horario.dia_semana.toLocaleLowerCase()
    && existente.estado === 'Activo'
    && horario.estado === 'Activo'
    && inicio < minutos(existente.hora_fin)
    && minutos(existente.hora_inicio) < fin
  ));
  if (haySolapamiento) {
    throw new Error('El horario se solapa con otro bloque activo del mismo día.');
  }
};

export const listarHorarios = async (): Promise<Horario[]> => repositorio.listar();
export const obtenerHorario = async (id: number): Promise<Horario | undefined> => repositorio.obtener(id);
export const crearHorario = async (datos: Omit<Horario, 'id_horario'>): Promise<Horario> => {
  validarHorario(datos);
  return repositorio.crear(datos);
};
export const actualizarHorario = async (
  id: number,
  cambios: Partial<Omit<Horario, 'id_horario'>>,
): Promise<Horario> => {
  const existente = await repositorio.obtener(id);
  if (!existente) {
    throw new Error(`No se encontró el horario ${id}.`);
  }
  validarHorario({ ...existente, ...cambios }, id);
  return repositorio.actualizar(id, cambios);
};
export const eliminarHorario = async (id: number): Promise<void> => repositorio.eliminar(id);
