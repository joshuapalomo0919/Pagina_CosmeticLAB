const PREFIJO_TABLA = 'cosmeticlab_db_';
const CLAVE_VERSION = 'cosmeticlab_db_version';
const CLAVE_USUARIOS_HEREDADA = 'cosmeticlab_users';
export const VERSION_ALMACEN = 2;

const obtenerAlmacen = (): Storage => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('El almacenamiento local no está disponible en este entorno.');
  }
  return window.localStorage;
};

const claveTabla = (tabla: string): string => (
  tabla === 'Usuario' ? CLAVE_USUARIOS_HEREDADA : `${PREFIJO_TABLA}${tabla}`
);

const mensajeError = (accion: string, tabla: string, error: unknown): Error => {
  const detalle = error instanceof Error ? ` ${error.message}` : '';
  return new Error(`No se pudo ${accion} la tabla "${tabla}".${detalle}`);
};

export const existeTabla = (tabla: string): boolean => {
  try {
    return obtenerAlmacen().getItem(claveTabla(tabla)) !== null;
  } catch (error) {
    throw mensajeError('consultar', tabla, error);
  }
};

export const leerTabla = <T>(tabla: string): T[] => {
  try {
    const contenido = obtenerAlmacen().getItem(claveTabla(tabla));
    if (contenido === null) {
      return [];
    }

    const filas: unknown = JSON.parse(contenido);
    if (!Array.isArray(filas)) {
      throw new Error('El contenido guardado no es una lista.');
    }
    return filas as T[];
  } catch (error) {
    throw mensajeError('leer', tabla, error);
  }
};

export const escribirTabla = <T>(tabla: string, filas: readonly T[]): void => {
  try {
    obtenerAlmacen().setItem(claveTabla(tabla), JSON.stringify(filas));
  } catch (error) {
    throw mensajeError('guardar', tabla, error);
  }
};

export const escribirTablasAtomico = (tablas: Readonly<Record<string, readonly unknown[]>>): void => {
  const almacen = obtenerAlmacen();
  const tablasAEscribir = Object.entries(tablas);
  const valoresAnteriores = new Map(
    tablasAEscribir.map(([tabla]) => [tabla, almacen.getItem(claveTabla(tabla))]),
  );
  const escritas: string[] = [];

  try {
    for (const [tabla, filas] of tablasAEscribir) {
      almacen.setItem(claveTabla(tabla), JSON.stringify(filas));
      escritas.push(tabla);
    }
  } catch (error) {
    const erroresRestauracion: string[] = [];
    for (const tabla of escritas.reverse()) {
      try {
        const anterior = valoresAnteriores.get(tabla);
        if (anterior === null || anterior === undefined) {
          almacen.removeItem(claveTabla(tabla));
        } else {
          almacen.setItem(claveTabla(tabla), anterior);
        }
      } catch (errorRestauracion) {
        const detalle = errorRestauracion instanceof Error ? errorRestauracion.message : String(errorRestauracion);
        erroresRestauracion.push(`${tabla}: ${detalle}`);
      }
    }

    const detalle = error instanceof Error ? error.message : String(error);
    const restauracion = erroresRestauracion.length > 0
      ? ` No se pudieron restaurar todas las tablas (${erroresRestauracion.join('; ')}).`
      : ' Los cambios previos fueron restaurados.';
    throw new Error(`No se pudo completar la escritura de datos.${restauracion} ${detalle}`);
  }
};

export const siguienteId = (tabla: string, pk: string): number => {
  const filas = leerTabla<Record<string, unknown>>(tabla);
  const maximo = filas.reduce((mayor, fila) => {
    const id = fila[pk];
    return typeof id === 'number' && Number.isFinite(id) ? Math.max(mayor, id) : mayor;
  }, 0);
  return maximo + 1;
};

export const migrar = (): void => {
  try {
    const almacen = obtenerAlmacen();
    const versionGuardada = almacen.getItem(CLAVE_VERSION);
    const version = versionGuardada === null ? 0 : Number(versionGuardada);
    if (!Number.isInteger(version) || version < 0 || version > VERSION_ALMACEN) {
      throw new Error(`Versión de almacén no compatible: ${versionGuardada}`);
    }

    if (version < 2) {
      migrarIdsUsuarios(almacen);
    }

    almacen.setItem(CLAVE_VERSION, String(VERSION_ALMACEN));
  } catch (error) {
    const detalle = error instanceof Error ? ` ${error.message}` : '';
    throw new Error(`No se pudo inicializar la versión de datos.${detalle}`);
  }
};

const migrarIdsUsuarios = (almacen: Storage): void => {
  const contenido = almacen.getItem(CLAVE_USUARIOS_HEREDADA);
  if (contenido === null) {
    return;
  }

  const filas: unknown = JSON.parse(contenido);
  if (!Array.isArray(filas)) {
    throw new Error('La tabla de usuarios guardada no contiene una lista.');
  }

  const usuarios = filas.map((fila: unknown, indice: number) => {
    if (typeof fila !== 'object' || fila === null || Array.isArray(fila)) {
      throw new Error(`El usuario guardado en la posición ${indice + 1} no es válido.`);
    }
    return fila as Record<string, unknown>;
  });

  const idsNumericos = usuarios
    .map((usuario) => usuario.id)
    .filter((id): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0);
  let siguiente = idsNumericos.reduce((maximo, id) => Math.max(maximo, id), 0) + 1;
  const idsAsignados = new Set<number>();

  const migrados = usuarios.map((usuario, indice) => {
    const idActual = usuario.id;
    const idValido = typeof idActual === 'number'
      && Number.isSafeInteger(idActual)
      && idActual > 0
      && !idsAsignados.has(idActual);
    const id = idValido ? idActual : siguiente++;
    if (!idValido && typeof idActual === 'number' && idActual > 0 && idsAsignados.has(idActual)) {
      throw new Error(`El usuario en la posición ${indice + 1} tiene un ID duplicado.`);
    }
    idsAsignados.add(id);
    return { ...usuario, id };
  });

  almacen.setItem(CLAVE_USUARIOS_HEREDADA, JSON.stringify(migrados));
};
