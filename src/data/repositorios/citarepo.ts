import type { Cita } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<Cita, 'id_cita'>(
  'Cita',
  'id_cita',
  {
    clavesForaneas: [
      { campo: 'id_usuario', tabla: 'Usuario', campoReferenciado: 'id' },
      { campo: 'id_maquilladora', tabla: 'Maquilladora', campoReferenciado: 'id_maquilladora' },
      { campo: 'id_horario', tabla: 'Horario', campoReferenciado: 'id_horario' },
    ],
    dependientes: [{ tabla: 'DetalleCita', campo: 'id_cita' }],
  },
);

export const listarCitas = async (): Promise<Cita[]> => repositorio.listar();
export const obtenerCita = async (id: number): Promise<Cita | undefined> => repositorio.obtener(id);
