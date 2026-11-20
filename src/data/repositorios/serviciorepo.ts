import type { Servicio } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<Servicio, 'id_servicio'>(
  'Servicio',
  'id_servicio',
  {
    camposUnicos: ['nombre'],
    dependientes: [{ tabla: 'DetalleCita', campo: 'id_servicio' }],
  },
);

export const listarServicios = async (): Promise<Servicio[]> => repositorio.listar();
export const obtenerServicio = async (id: number): Promise<Servicio | undefined> => repositorio.obtener(id);
export const crearServicio = async (datos: Omit<Servicio, 'id_servicio'>): Promise<Servicio> => (
  repositorio.crear(datos)
);
export const actualizarServicio = async (
  id: number,
  cambios: Partial<Omit<Servicio, 'id_servicio'>>,
): Promise<Servicio> => repositorio.actualizar(id, cambios);
export const eliminarServicio = async (id: number): Promise<void> => repositorio.eliminar(id);
