import type { Marca } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<Marca, 'id_marca'>(
  'Marca',
  'id_marca',
  {
    camposUnicos: ['nombre'],
    dependientes: [{ tabla: 'Producto', campo: 'id_marca' }],
  },
);

export const listarMarcas = async (): Promise<Marca[]> => repositorio.listar();
export const crearMarca = async (datos: Omit<Marca, 'id_marca'>): Promise<Marca> => repositorio.crear(datos);
export const actualizarMarca = async (
  id: number,
  cambios: Partial<Omit<Marca, 'id_marca'>>,
): Promise<Marca> => repositorio.actualizar(id, cambios);

export const cambiarEstadoMarca = async (id: number, estado: Marca['estado']): Promise<Marca> => (
  repositorio.actualizar(id, { estado })
);
