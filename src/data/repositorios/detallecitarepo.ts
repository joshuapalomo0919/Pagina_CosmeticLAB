import type { DetalleCita } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<DetalleCita, 'id_detalle_cita'>(
  'DetalleCita',
  'id_detalle_cita',
  {
    clavesForaneas: [
      { campo: 'id_servicio', tabla: 'Servicio', campoReferenciado: 'id_servicio' },
      { campo: 'id_cita', tabla: 'Cita', campoReferenciado: 'id_cita' },
    ],
  },
);

export const listarDetallesCita = async (): Promise<DetalleCita[]> => repositorio.listar();
