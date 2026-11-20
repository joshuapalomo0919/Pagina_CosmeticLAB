import type { DetalleProducto } from '../../types/modelos';
import { crearRepositorio } from './crearrepositorio';

const repositorio = crearRepositorio<DetalleProducto, 'id_detalle_producto'>(
  'DetalleProducto',
  'id_detalle_producto',
  {
    clavesForaneas: [
      { campo: 'id_producto', tabla: 'Producto', campoReferenciado: 'id_producto' },
    ],
  },
);

export const listarDetallesProducto = async (): Promise<DetalleProducto[]> => repositorio.listar();
export const listarDetallesPorProducto = async (idProducto: number): Promise<DetalleProducto[]> => (
  (await repositorio.listar()).filter((detalle) => detalle.id_producto === idProducto)
);
