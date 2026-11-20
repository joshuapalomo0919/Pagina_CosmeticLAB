import type { Categoria } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<Categoria, 'id_categoria'>(
  'Categoria',
  'id_categoria',
  {
    camposUnicos: ['nombre'],
    dependientes: [{ tabla: 'Producto', campo: 'id_categoria' }],
  },
);

export const listarCategorias = async (): Promise<Categoria[]> => repositorio.listar();
export const crearCategoria = async (datos: Omit<Categoria, 'id_categoria'>): Promise<Categoria> => (
  repositorio.crear(datos)
);
export const actualizarCategoria = async (
  id: number,
  cambios: Partial<Omit<Categoria, 'id_categoria'>>,
): Promise<Categoria> => repositorio.actualizar(id, cambios);
export const eliminarCategoria = async (id: number): Promise<void> => repositorio.eliminar(id);
