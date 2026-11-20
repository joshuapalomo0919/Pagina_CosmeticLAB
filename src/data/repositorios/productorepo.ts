import type { Producto } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<Producto, 'id_producto'>(
  'Producto',
  'id_producto',
  {
    clavesForaneas: [
      { campo: 'id_categoria', tabla: 'Categoria', campoReferenciado: 'id_categoria' },
      { campo: 'id_marca', tabla: 'Marca', campoReferenciado: 'id_marca' },
    ],
    dependientes: [
      { tabla: 'DetalleProducto', campo: 'id_producto' },
      { tabla: 'DetalleCarrito', campo: 'id_producto' },
      { tabla: 'DetallePedido', campo: 'id_producto' },
      { tabla: 'ProductoProveedor', campo: 'id_producto' },
    ],
  },
);

export const listarProductos = async (): Promise<Producto[]> => repositorio.listar();
export const obtenerProducto = async (id: number): Promise<Producto | undefined> => repositorio.obtener(id);
export const crearProducto = async (datos: Omit<Producto, 'id_producto'>): Promise<Producto> => (
  repositorio.crear(datos)
);
export const actualizarProducto = async (
  id: number,
  cambios: Partial<Omit<Producto, 'id_producto'>>,
): Promise<Producto> => repositorio.actualizar(id, cambios);
export const eliminarProducto = async (id: number): Promise<void> => repositorio.eliminar(id);
