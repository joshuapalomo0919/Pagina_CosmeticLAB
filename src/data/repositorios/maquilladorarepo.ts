import type { Maquilladora } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<Maquilladora, 'id_maquilladora'>(
  'Maquilladora',
  'id_maquilladora',
  {
    camposUnicos: ['nombre'],
    dependientes: [{ tabla: 'Cita', campo: 'id_maquilladora' }],
  },
);

export const listarMaquilladoras = async (): Promise<Maquilladora[]> => repositorio.listar();
export const listarMaquilladorasActivas = async (): Promise<Maquilladora[]> => (
  (await repositorio.listar()).filter((maquilladora) => maquilladora.estado === 'Activo')
);
export const crearMaquilladora = async (
  datos: Omit<Maquilladora, 'id_maquilladora'>,
): Promise<Maquilladora> => repositorio.crear(datos);
export const actualizarMaquilladora = async (
  id: number,
  cambios: Partial<Omit<Maquilladora, 'id_maquilladora'>>,
): Promise<Maquilladora> => repositorio.actualizar(id, cambios);
export const eliminarMaquilladora = async (id: number): Promise<void> => repositorio.eliminar(id);
