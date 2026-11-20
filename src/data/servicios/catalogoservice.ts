import {
  leerTabla,
  siguienteId,
  escribirTablasAtomico,
} from '../almacen';
import type {
  Categoria,
  DetalleProducto,
  Marca,
  Producto,
  ProductoVista,
  SqlDateTime,
} from '../../types/modelos';
import { ahoraSQL } from '../../utils/formato';

export interface DatosPrecioProducto {
  costo: number;
  precio_venta: number;
  stock_minimo: number;
}

export type DatosProducto = Omit<Producto, 'id_producto' | 'estado' | 'fecha_registro'> & {
  fecha_registro?: SqlDateTime;
  costo: number;
  stock_minimo: number;
};

const validarPrecioDetalle = (datos: DatosPrecioProducto): void => {
  if (!Number.isFinite(datos.costo) || datos.costo < 0) {
    throw new Error('El costo debe ser un valor numérico igual o mayor que cero.');
  }
  if (!Number.isFinite(datos.precio_venta) || datos.precio_venta < 0) {
    throw new Error('El precio de venta debe ser un valor numérico igual o mayor que cero.');
  }
  if (!Number.isInteger(datos.stock_minimo) || datos.stock_minimo < 0) {
    throw new Error('El stock mínimo debe ser un entero igual o mayor que cero.');
  }
};

const validarDatosProducto = (datos: DatosProducto): void => {
  validarPrecioDetalle({
    costo: datos.costo,
    precio_venta: datos.precio,
    stock_minimo: datos.stock_minimo,
  });
  if (!Number.isFinite(datos.precio) || datos.precio < 0) {
    throw new Error('El precio debe ser un valor numérico igual o mayor que cero.');
  }
  if (!Number.isInteger(datos.stock) || datos.stock < 0) {
    throw new Error('El stock debe ser un entero igual o mayor que cero.');
  }
  if (datos.destacado !== 0 && datos.destacado !== 1) {
    throw new Error('El valor de destacado debe ser 0 o 1.');
  }
  if (!Number.isInteger(datos.id_categoria) || !Number.isInteger(datos.id_marca)) {
    throw new Error('Selecciona una categoría y una marca válidas.');
  }
};

const obtenerDetalleVigente = (
  detalles: readonly DetalleProducto[],
  idProducto: number,
  ahora: SqlDateTime,
): DetalleProducto | null => {
  const vigentes = detalles.filter((detalle) => (
    detalle.id_producto === idProducto
    && detalle.fecha_ini <= ahora
    && (detalle.fecha_fin === null || detalle.fecha_fin >= ahora)
  ));
  if (vigentes.length > 1) {
    throw new Error(`El producto ${idProducto} tiene más de un detalle de precio vigente.`);
  }
  return vigentes[0] ?? null;
};

const desplazarSegundo = (fechaSql: SqlDateTime, desplazamiento: number): SqlDateTime => {
  const [fecha, hora] = fechaSql.split(' ');
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [horas, minutos, segundos] = hora.split(':').map(Number);
  const fechaLocal = new Date(anio, mes - 1, dia, horas, minutos, segundos);
  fechaLocal.setSeconds(fechaLocal.getSeconds() + desplazamiento);
  const dosDigitos = (valor: number): string => String(valor).padStart(2, '0');
  return `${fechaLocal.getFullYear()}-${dosDigitos(fechaLocal.getMonth() + 1)}-${dosDigitos(fechaLocal.getDate())} `
    + `${dosDigitos(fechaLocal.getHours())}:${dosDigitos(fechaLocal.getMinutes())}:${dosDigitos(fechaLocal.getSeconds())}`;
};

const inicioNuevaVigencia = (ahora: SqlDateTime, actual: DetalleProducto): SqlDateTime => {
  const posteriorAlInicioActual = desplazarSegundo(actual.fecha_ini, 1);
  return posteriorAlInicioActual > ahora ? posteriorAlInicioActual : ahora;
};

const construirCatalogo = async (soloMarcasActivas: boolean): Promise<ProductoVista[]> => {
  const [productos, categorias, marcas, detalles] = await Promise.all([
    Promise.resolve(leerTabla<Producto>('Producto')),
    Promise.resolve(leerTabla<Categoria>('Categoria')),
    Promise.resolve(leerTabla<Marca>('Marca')),
    Promise.resolve(leerTabla<DetalleProducto>('DetalleProducto')),
  ]);
  const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id_categoria, categoria]));
  const marcasPorId = new Map(marcas.map((marca) => [marca.id_marca, marca]));
  const ahora = ahoraSQL();

  return productos.flatMap((producto) => {
    const categoria = categoriasPorId.get(producto.id_categoria);
    if (!categoria) {
      throw new Error(`El producto ${producto.id_producto} hace referencia a una categoría inexistente.`);
    }
    const marca = marcasPorId.get(producto.id_marca);
    if (!marca) {
      throw new Error(`El producto ${producto.id_producto} hace referencia a una marca inexistente.`);
    }
    if (soloMarcasActivas && marca.estado !== 'Activo') {
      return [];
    }
    const detalle = obtenerDetalleVigente(detalles, producto.id_producto, ahora);
    const stock = detalle?.stock ?? producto.stock;
    return [{
      ...producto,
      precio: detalle?.precio_venta ?? producto.precio,
      stock,
      imagen: detalle?.imagen || producto.imagen,
      estado: stock === 0 ? 'Agotado' : 'Disponible',
      categoria_nombre: categoria.nombre,
      marca_nombre: marca.nombre,
      detalle_vigente: detalle,
    }];
  });
};

export const obtenerCatalogo = async (): Promise<ProductoVista[]> => construirCatalogo(true);

export const obtenerCatalogoAdmin = async (): Promise<ProductoVista[]> => construirCatalogo(false);

export const obtenerHistorialPrecios = async (idProducto: number): Promise<DetalleProducto[]> => (
  leerTabla<DetalleProducto>('DetalleProducto')
    .filter((detalle) => detalle.id_producto === idProducto)
    .sort((a, b) => b.fecha_ini.localeCompare(a.fecha_ini) || b.id_detalle_producto - a.id_detalle_producto)
);

export const guardarProducto = async (
  datos: DatosProducto,
  idProducto?: number,
): Promise<Producto> => {
  validarDatosProducto(datos);
  const [productos, categorias, marcas, detalles] = await Promise.all([
    Promise.resolve(leerTabla<Producto>('Producto')),
    Promise.resolve(leerTabla<Categoria>('Categoria')),
    Promise.resolve(leerTabla<Marca>('Marca')),
    Promise.resolve(leerTabla<DetalleProducto>('DetalleProducto')),
  ]);
  if (!categorias.some((categoria) => categoria.id_categoria === datos.id_categoria)) {
    throw new Error('La categoría seleccionada ya no existe.');
  }
  if (!marcas.some((marca) => marca.id_marca === datos.id_marca)) {
    throw new Error('La marca seleccionada ya no existe.');
  }

  const ahora = ahoraSQL();
  const productoExistente = idProducto === undefined
    ? undefined
    : productos.find((producto) => producto.id_producto === idProducto);
  if (idProducto !== undefined && !productoExistente) {
    throw new Error(`No se encontró el producto ${idProducto}.`);
  }

  const detalleVigente = idProducto === undefined
    ? null
    : obtenerDetalleVigente(detalles, idProducto, ahora);
  const id = idProducto ?? siguienteId('Producto', 'id_producto');
  const producto: Producto = {
    id_producto: id,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion,
    precio: datos.precio,
    stock: datos.stock,
    imagen: datos.imagen.trim(),
    estado: datos.stock === 0 ? 'Agotado' : 'Disponible',
    destacado: datos.destacado,
    fecha_registro: productoExistente?.fecha_registro ?? datos.fecha_registro ?? ahora,
    id_categoria: datos.id_categoria,
    id_marca: datos.id_marca,
  };

  const precioCambio = detalleVigente !== null && (
    detalleVigente.costo !== datos.costo
    || detalleVigente.precio_venta !== datos.precio
    || detalleVigente.stock_minimo !== datos.stock_minimo
  );
  const imagenCambio = detalleVigente !== null && detalleVigente.imagen !== producto.imagen;
  let nuevosDetalles: DetalleProducto[];

  if (detalleVigente && precioCambio) {
    const fechaIniNueva = inicioNuevaVigencia(ahora, detalleVigente);
    const detalleCerrado: DetalleProducto = {
      ...detalleVigente,
      fecha_fin: desplazarSegundo(fechaIniNueva, -1),
    };
    const detalleNuevo: DetalleProducto = {
      id_detalle_producto: siguienteId('DetalleProducto', 'id_detalle_producto'),
      id_producto: id,
      costo: datos.costo,
      precio_venta: datos.precio,
      stock: datos.stock,
      stock_minimo: datos.stock_minimo,
      imagen: producto.imagen,
      fecha_ini: fechaIniNueva,
      fecha_fin: null,
    };
    nuevosDetalles = detalles
      .map((detalle) => detalle.id_detalle_producto === detalleVigente.id_detalle_producto
        ? detalleCerrado
        : detalle)
      .concat(detalleNuevo);
  } else if (detalleVigente) {
    nuevosDetalles = detalles.map((detalle) => (
      detalle.id_detalle_producto === detalleVigente.id_detalle_producto
        ? {
          ...detalle,
          stock: datos.stock,
          ...(imagenCambio ? { imagen: producto.imagen } : {}),
        }
        : detalle
    ));
  } else {
    const detalleNuevo: DetalleProducto = {
      id_detalle_producto: siguienteId('DetalleProducto', 'id_detalle_producto'),
      id_producto: id,
      costo: datos.costo,
      precio_venta: datos.precio,
      stock: datos.stock,
      stock_minimo: datos.stock_minimo,
      imagen: producto.imagen,
      fecha_ini: ahora,
      fecha_fin: null,
    };
    nuevosDetalles = [...detalles, detalleNuevo];
  }

  const nuevosProductos = productoExistente
    ? productos.map((fila) => fila.id_producto === id ? producto : fila)
    : [...productos, producto];
  escribirTablasAtomico({
    Producto: nuevosProductos,
    DetalleProducto: nuevosDetalles,
  });
  return producto;
};

export const cambiarPrecio = async (
  idProducto: number,
  datos: DatosPrecioProducto,
): Promise<Producto> => {
  validarPrecioDetalle(datos);
  const productos = leerTabla<Producto>('Producto');
  const detalles = leerTabla<DetalleProducto>('DetalleProducto');
  const producto = productos.find((fila) => fila.id_producto === idProducto);
  if (!producto) {
    throw new Error(`No se encontró el producto ${idProducto}.`);
  }
  const vigente = obtenerDetalleVigente(detalles, idProducto, ahoraSQL());
  const ahora = ahoraSQL();
  const nuevoDetalle: DetalleProducto = {
    id_detalle_producto: siguienteId('DetalleProducto', 'id_detalle_producto'),
    id_producto: idProducto,
    costo: datos.costo,
    precio_venta: datos.precio_venta,
    stock: vigente?.stock ?? producto.stock,
    stock_minimo: datos.stock_minimo,
    imagen: producto.imagen,
    fecha_ini: vigente ? inicioNuevaVigencia(ahora, vigente) : ahora,
    fecha_fin: null,
  };
  const productoActualizado: Producto = {
    ...producto,
    precio: datos.precio_venta,
    stock: nuevoDetalle.stock,
    estado: nuevoDetalle.stock === 0 ? 'Agotado' : 'Disponible',
  };
  const detallesActualizados = vigente
    ? detalles.map((detalle) => detalle.id_detalle_producto === vigente.id_detalle_producto
      ? { ...detalle, fecha_fin: desplazarSegundo(nuevoDetalle.fecha_ini, -1) }
      : detalle)
    : detalles;
  escribirTablasAtomico({
    Producto: productos.map((fila) => fila.id_producto === idProducto ? productoActualizado : fila),
    DetalleProducto: [...detallesActualizados, nuevoDetalle],
  });
  return productoActualizado;
};

export const ajustarStock = async (idProducto: number, delta: number): Promise<Producto> => {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error('El ajuste de stock debe ser un entero distinto de cero.');
  }
  const productos = leerTabla<Producto>('Producto');
  const detalles = leerTabla<DetalleProducto>('DetalleProducto');
  const producto = productos.find((fila) => fila.id_producto === idProducto);
  if (!producto) {
    throw new Error(`No se encontró el producto ${idProducto}.`);
  }
  const vigente = obtenerDetalleVigente(detalles, idProducto, ahoraSQL());
  if (!vigente) {
    throw new Error('El producto no tiene un detalle de inventario vigente.');
  }

  const stock = vigente.stock + delta;
  if (stock < 0) {
    throw new Error('El ajuste dejaría el stock en un valor negativo.');
  }
  const productoActualizado: Producto = {
    ...producto,
    stock,
    estado: stock === 0 ? 'Agotado' : 'Disponible',
  };
  escribirTablasAtomico({
    Producto: productos.map((fila) => fila.id_producto === idProducto ? productoActualizado : fila),
    DetalleProducto: detalles.map((detalle) => (
      detalle.id_detalle_producto === vigente.id_detalle_producto ? { ...detalle, stock } : detalle
    )),
  });
  return productoActualizado;
};
