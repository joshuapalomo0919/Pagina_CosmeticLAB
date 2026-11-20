import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directorioCsv = path.join(raiz, 'scripts', 'csv');
const directorioSemillas = path.join(raiz, 'src', 'data', 'semillas');

const tablas = [
  'Rol', 'Usuario', 'Categoria', 'Marca', 'Proveedor', 'Servicio', 'Horario',
  'Producto', 'DetalleProducto', 'ProductoProveedor', 'RolUsuario', 'Carrito',
  'Pedido', 'Cita', 'DetalleCarrito', 'DetallePedido', 'DetalleCita', 'Entregas',
  'Notificaciones', 'pqr',
];

const alias = new Map([
  ['id_detalleproducto', 'id_detalle_producto'],
  ['id_rolusuario', 'id_rol_usuario'],
  ['id_productoproveedor', 'id_producto_proveedor'],
  ['id_detallecita', 'id_detalle_cita'],
]);

const idPorTabla = {
  Rol: 'id_rol',
  Usuario: 'id',
  Categoria: 'id_categoria',
  Marca: 'id_marca',
  Proveedor: 'id_proveedor',
  Servicio: 'id_servicio',
  Horario: 'id_horario',
  Producto: 'id_producto',
  DetalleProducto: 'id_detalle_producto',
  ProductoProveedor: 'id_producto_proveedor',
  RolUsuario: 'id_rol_usuario',
  Carrito: 'id_carrito',
  Pedido: 'id_pedido',
  Cita: 'id_cita',
  DetalleCarrito: 'id_detalle_carrito',
  DetallePedido: 'id_detalle_pedido',
  DetalleCita: 'id_detalle_cita',
  Entregas: 'id_entrega',
  Notificaciones: 'id_notificacion',
  pqr: 'id_pqr',
};

const camposPorTabla = {
  Rol: ['id_rol', 'nombre', 'descripcion'],
  RolUsuario: ['id_rol_usuario', 'id_rol', 'id_usuario'],
  Categoria: ['id_categoria', 'nombre', 'descripcion'],
  Marca: ['id_marca', 'nombre', 'descripcion', 'logo', 'estado'],
  Producto: [
    'id_producto', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'estado',
    'destacado', 'fecha_registro', 'id_categoria', 'id_marca',
  ],
  DetalleProducto: [
    'id_detalle_producto', 'id_producto', 'costo', 'precio_venta', 'stock',
    'stock_minimo', 'imagen', 'fecha_ini', 'fecha_fin',
  ],
  Proveedor: ['id_proveedor', 'nombre', 'telefono', 'correo', 'direccion'],
  Servicio: ['id_servicio', 'nombre', 'descripcion', 'precio', 'imagen', 'duracion', 'estado'],
  Horario: [
    'id_horario', 'dia_semana', 'hora_inicio', 'hora_fin', 'estado_disponibilidad', 'estado',
  ],
  ProductoProveedor: ['id_producto_proveedor', 'id_producto', 'id_proveedor', 'precio_compra'],
  Pedido: [
    'id_pedido', 'id_usuario', 'fecha_pedido', 'estado', 'total', 'observaciones',
    'fecha_actualizacion', 'metodo_pago', 'comprobante_pago', 'modalidad_entrega',
    'direccion_entrega',
  ],
  Cita: [
    'id_cita', 'id_usuario', 'fecha', 'hora_inicio', 'hora_fin', 'ubicacion',
    'estado', 'observaciones', 'fecha_solicitud', 'id_horario', 'total',
    'monto_anticipo', 'comprobante_anticipo',
  ],
  DetalleCita: [
    'id_detalle_cita', 'id_servicio', 'id_cita', 'cantidad_personas',
    'precio_unitario', 'subtotal',
  ],
};

const columnasEnteras = new Set([
  'stock', 'stock_minimo', 'cantidad_personas', 'cantidad', 'destacado',
]);

const columnasDecimales = new Set([
  'precio', 'costo', 'precio_venta', 'precio_compra', 'total', 'subtotal',
  'precio_unitario', 'monto_anticipo',
]);

const normalizarEncabezado = (encabezado, tabla) => {
  if (tabla === 'Horario' && encabezado.trim() === 'Estado') {
    return 'estado_disponibilidad';
  }
  const normalizado = encabezado
    .replace(/^\uFEFF/, '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
  return alias.get(normalizado) ?? normalizado;
};

const leerCsv = (contenido, nombreArchivo) => {
  const filas = [];
  let fila = [];
  let campo = '';
  let entreComillas = false;
  let comillaCerrada = false;
  let registroIniciado = false;
  let linea = 1;
  let lineaRegistro = 1;
  const texto = contenido.replace(/^\uFEFF/, '');

  const terminarCampo = () => {
    fila.push(campo);
    campo = '';
    comillaCerrada = false;
  };

  const terminarFila = () => {
    terminarCampo();
    filas.push({ valores: fila, linea: lineaRegistro });
    fila = [];
    registroIniciado = false;
    linea += 1;
    lineaRegistro = linea;
  };

  for (let indice = 0; indice < texto.length; indice += 1) {
    const caracter = texto[indice];

    if (entreComillas) {
      if (caracter === '"' && texto[indice + 1] === '"') {
        campo += '"';
        indice += 1;
      } else if (caracter === '"') {
        entreComillas = false;
        comillaCerrada = true;
      } else {
        campo += caracter;
        if (caracter === '\n') {
          linea += 1;
        } else if (caracter === '\r' && texto[indice + 1] !== '\n') {
          linea += 1;
        }
      }
      continue;
    }

    if (comillaCerrada && caracter !== ',' && caracter !== '\r' && caracter !== '\n' && !/\s/.test(caracter)) {
      throw new Error(`${nombreArchivo}: carácter inesperado después de cerrar comillas en la línea ${linea}.`);
    }

    if (caracter === '"' && campo.trim() === '' && !comillaCerrada) {
      campo = '';
      entreComillas = true;
      registroIniciado = true;
    } else if (caracter === ',') {
      terminarCampo();
      registroIniciado = true;
    } else if (caracter === '\n' || caracter === '\r') {
      if (caracter === '\r' && texto[indice + 1] === '\n') {
        indice += 1;
      }
      terminarFila();
    } else {
      campo += caracter;
      if (!/\s/.test(caracter)) {
        registroIniciado = true;
      }
    }
  }

  if (entreComillas) {
    throw new Error(`${nombreArchivo}: campo CSV sin comilla de cierre (desde la línea ${lineaRegistro}).`);
  }
  if (registroIniciado || fila.length > 0 || campo.length > 0 || comillaCerrada) {
    filas.push({ valores: [...fila, campo], linea: lineaRegistro });
  }
  return filas;
};

const filaVacia = ({ valores }) => valores.every((valor) => valor.trim() === '');

const obtenerEsquema = (filas, nombreArchivo) => {
  const indiceDatos = filas.findIndex(({ valores }) => (
    valores.find((valor) => valor.trim() !== '')?.trim().toLocaleLowerCase() === 'datos de ejemplo'
  ));
  const indiceEncabezados = indiceDatos === -1 ? filas.findIndex((fila) => !filaVacia(fila)) : indiceDatos + 1;

  if (indiceEncabezados < 0 || indiceEncabezados >= filas.length || filaVacia(filas[indiceEncabezados])) {
    throw new Error(`${nombreArchivo}: no se encontró una fila de encabezados válida.`);
  }

  const valoresEncabezados = filas[indiceEncabezados].valores;
  const inicioColumna = valoresEncabezados.findIndex((encabezado) => encabezado.trim() !== '');
  const finColumna = valoresEncabezados.findLastIndex((encabezado) => encabezado.trim() !== '') + 1;
  const indicesColumnas = valoresEncabezados
    .map((encabezado, indice) => encabezado.trim() !== '' ? indice : -1)
    .filter((indice) => indice >= 0);
  const encabezados = indicesColumnas.map((indice) => (
    valoresEncabezados[indice]
  )).map((encabezado) => (
    normalizarEncabezado(encabezado, nombreArchivo.replace(/\.csv$/i, ''))
  ));
  if (encabezados.some((encabezado) => encabezado === '')) {
    throw new Error(`${nombreArchivo}: hay encabezados vacíos.`);
  }
  if (new Set(encabezados).size !== encabezados.length) {
    throw new Error(`${nombreArchivo}: hay encabezados duplicados después de normalizarlos.`);
  }

  return {
    encabezados,
    indicesColumnas,
    inicioColumna,
    finColumna,
    filasDatos: filas.slice(indiceEncabezados + 1),
    lineaInicial: filas[indiceEncabezados].linea + 1,
  };
};

const esFecha = (columna) => columna === 'fecha' || columna.startsWith('fecha_') || columna.endsWith('_fecha');

const validarFechaIso = (valor, nombreArchivo, columna, linea) => {
  const fechaAmbigua = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor);
  if (fechaAmbigua) {
    throw new Error(
      `${nombreArchivo}: fecha ambigua "${valor}" en "${columna}", línea ${linea}. Usa YYYY-MM-DD.`,
    );
  }

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!coincidencia) {
    throw new Error(`${nombreArchivo}: fecha inválida "${valor}" en "${columna}", línea ${linea}. Usa YYYY-MM-DD.`);
  }
  const [, anio, mes, dia] = coincidencia;
  const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  if (
    fecha.getUTCFullYear() !== Number(anio)
    || fecha.getUTCMonth() !== Number(mes) - 1
    || fecha.getUTCDate() !== Number(dia)
  ) {
    throw new Error(`${nombreArchivo}: fecha inválida "${valor}" en "${columna}", línea ${linea}.`);
  }
  return valor;
};

const normalizarHora = (valor, nombreArchivo, columna, linea) => {
  const horaAmbigua = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(valor);
  if (!horaAmbigua) {
    throw new Error(`${nombreArchivo}: hora inválida "${valor}" en "${columna}", línea ${linea}. Usa HH:mm:ss.`);
  }
  const [, hora, minuto, segundo] = horaAmbigua;
  if (Number(hora) > 23 || Number(minuto) > 59 || Number(segundo) > 59) {
    throw new Error(`${nombreArchivo}: hora fuera de rango "${valor}" en "${columna}", línea ${linea}.`);
  }
  return `${hora.padStart(2, '0')}:${minuto}:${segundo}`;
};

const normalizarFechaHora = (valor, nombreArchivo, columna, linea) => {
  const fechaHoraAmbigua = /^(\d{1,2}\/\d{1,2}\/\d{4})\s+/.exec(valor);
  if (fechaHoraAmbigua) {
    throw new Error(
      `${nombreArchivo}: fecha ambigua "${valor}" en "${columna}", línea ${linea}. Usa YYYY-MM-DD HH:mm:ss.`,
    );
  }

  const coincidencia = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2}:\d{2})$/.exec(valor);
  if (!coincidencia) {
    throw new Error(
      `${nombreArchivo}: fecha y hora inválidas "${valor}" en "${columna}", línea ${linea}. Usa YYYY-MM-DD HH:mm:ss.`,
    );
  }
  const [, fecha, hora] = coincidencia;
  return `${validarFechaIso(fecha, nombreArchivo, columna, linea)} ${normalizarHora(hora, nombreArchivo, columna, linea)}`;
};

const convertirValor = (columna, valorCsv, nombreArchivo, linea) => {
  const valor = valorCsv.trim();
  if (valor === '' || valor.toLocaleUpperCase() === 'NULL') {
    return null;
  }

  if (columna.startsWith('id') && (columna === 'id' || columna.startsWith('id_'))) {
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero)) {
      throw new Error(`${nombreArchivo}: "${valor}" no es un ID entero válido en la línea ${linea}.`);
    }
    return numero;
  }

  if (columnasEnteras.has(columna)) {
    const numero = Number(valor);
    if (!Number.isSafeInteger(numero)) {
      throw new Error(`${nombreArchivo}: "${valor}" no es un entero válido en "${columna}", línea ${linea}.`);
    }
    if (columna === 'destacado' && numero !== 0 && numero !== 1) {
      throw new Error(`${nombreArchivo}: destacado debe ser 0 o 1 en la línea ${linea}.`);
    }
    return numero;
  }

  if (columnasDecimales.has(columna)) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
      throw new Error(`${nombreArchivo}: "${valor}" no es un decimal válido en "${columna}", línea ${linea}.`);
    }
    return numero;
  }

  if (esFecha(columna)) {
    if (/^\d{4}-\d{2}-\d{2}[ T]/.test(valor)) {
      return normalizarFechaHora(valor, nombreArchivo, columna, linea);
    }
    return validarFechaIso(valor, nombreArchivo, columna, linea);
  }

  if (columna.startsWith('hora_') || columna === 'hora') {
    return normalizarHora(valor, nombreArchivo, columna, linea);
  }

  return valor;
};

const tieneId = (valores, encabezados, tabla) => {
  const campoId = idPorTabla[tabla];
  const indiceId = encabezados.indexOf(campoId);
  if (indiceId < 0) {
    return false;
  }
  const valor = valores[indiceId];
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return false;
  }
  return true;
};

const convertirTabla = (contenido, tabla, nombreArchivo) => {
  const filas = leerCsv(contenido, nombreArchivo);
  const {
    encabezados,
    indicesColumnas,
    inicioColumna,
    finColumna,
    filasDatos,
  } = obtenerEsquema(filas, nombreArchivo);
  const registros = [];
  let descartadas = 0;

  for (const fila of filasDatos) {
    if (filaVacia(fila)) {
      descartadas += 1;
      continue;
    }
    const valores = indicesColumnas.map((indice) => fila.valores[indice] ?? '');
    while (valores.length < encabezados.length) {
      valores.push('');
    }
    if (!tieneId(valores, encabezados, tabla)) {
      descartadas += 1;
      continue;
    }
    if (
      fila.valores.slice(0, inicioColumna).some((valor) => valor.trim() !== '')
      || fila.valores.slice(finColumna).some((valor) => valor.trim() !== '')
      || fila.valores.some((valor, indice) => (
        indice >= inicioColumna
        && indice < finColumna
        && !indicesColumnas.includes(indice)
        && valor.trim() !== ''
      ))
    ) {
      throw new Error(`${nombreArchivo}: hay más columnas que encabezados en la línea ${fila.linea}.`);
    }

    const registro = Object.fromEntries(encabezados.map((encabezado, indice) => [
      encabezado,
      convertirValor(encabezado, valores[indice], nombreArchivo, fila.linea),
    ]));
    registros.push(registro);
  }

  const esperados = camposPorTabla[tabla];
  const faltantes = esperados
    ? esperados.filter((campo) => !encabezados.includes(campo))
    : [];
  return {
    registros,
    leidas: filasDatos.length,
    descartadas,
    faltantes,
    esquemaPendiente: !esperados,
  };
};

const archivosCsv = new Set((await readdir(directorioCsv)).filter((archivo) => archivo.toLocaleLowerCase().endsWith('.csv')));
const procesadas = [];
await mkdir(directorioSemillas, { recursive: true });

for (const tabla of tablas) {
  const nombreCsv = `${tabla}.csv`;
  if (!archivosCsv.has(nombreCsv)) {
    continue;
  }

  const contenido = await readFile(path.join(directorioCsv, nombreCsv), 'utf8');
  const resultado = convertirTabla(contenido, tabla, nombreCsv);
  await writeFile(
    path.join(directorioSemillas, `${tabla}.json`),
    `${JSON.stringify(resultado.registros, null, 2)}\n`,
    'utf8',
  );
  procesadas.push({
    tabla,
    ...resultado,
  });
}

if (procesadas.length === 0) {
  throw new Error('No se encontraron archivos CSV. Guárdalos en scripts/csv/ con el nombre exacto de cada entidad.');
}

console.log('Resumen de semillas:');
for (const tabla of procesadas) {
  const faltantes = tabla.esquemaPendiente
    ? 'no definidos (diccionario pendiente)'
    : tabla.faltantes.length > 0 ? tabla.faltantes.join(', ') : 'ninguno';
  console.log(
    `- ${tabla.tabla}: filas leídas ${tabla.leidas}; descartadas ${tabla.descartadas}; `
    + `convertidas ${tabla.registros.length}; campos faltantes ${faltantes}`,
  );
}
