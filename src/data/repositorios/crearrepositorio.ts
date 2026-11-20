import { existeTabla, leerTabla, siguienteId, escribirTabla } from '../almacen';

type Campo<T> = Extract<keyof T, string>;

interface ClaveForanea<T> {
  campo: Campo<T>;
  tabla: string;
  campoReferenciado: string;
}

interface Dependiente {
  tabla: string;
  campo: string;
}

interface OpcionesRepositorio<T> {
  camposUnicos?: readonly Campo<T>[];
  clavesForaneas?: readonly ClaveForanea<T>[];
  dependientes?: readonly Dependiente[];
}

const valorCampo = (fila: object, campo: string): unknown => (
  (fila as Record<string, unknown>)[campo]
);

const valoresIguales = (a: unknown, b: unknown): boolean => {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
  }
  return Object.is(a, b);
};

export const crearRepositorio = <T extends object, PK extends Campo<T>>(
  tabla: string,
  pk: PK,
  opciones: OpcionesRepositorio<T> = {},
) => {
  const validar = (fila: T, filas: readonly T[], idIgnorado?: T[PK]): void => {
    for (const campo of opciones.camposUnicos ?? []) {
      const valor = valorCampo(fila, campo);
      if (valor === null || valor === undefined) {
        continue;
      }
      const duplicado = filas.some((existente) => (
        !Object.is(existente[pk], idIgnorado)
        && valoresIguales(valorCampo(existente, campo), valor)
      ));
      if (duplicado) {
        throw new Error(`Ya existe un registro con el valor "${String(valor)}" en ${campo}.`);
      }
    }

    for (const clave of opciones.clavesForaneas ?? []) {
      const valor = valorCampo(fila, clave.campo);
      const encontrados = leerTabla<Record<string, unknown>>(clave.tabla);
      if (!encontrados.some((referenciado) => (
        valoresIguales(referenciado[clave.campoReferenciado], valor)
      ))) {
        throw new Error(`No existe el registro relacionado en ${clave.tabla} (${clave.campo}).`);
      }
    }
  };

  return {
    async listar(): Promise<T[]> {
      return leerTabla<T>(tabla);
    },

    async obtener(id: T[PK]): Promise<T | undefined> {
      return leerTabla<T>(tabla).find((fila) => Object.is(fila[pk], id));
    },

    async crear(datos: Omit<T, PK>): Promise<T> {
      const filas = leerTabla<T>(tabla);
      const fila = { ...datos, [pk]: siguienteId(tabla, pk) } as T;
      validar(fila, filas);
      escribirTabla(tabla, [...filas, fila]);
      return fila;
    },

    async actualizar(id: T[PK], cambios: Partial<Omit<T, PK>>): Promise<T> {
      const filas = leerTabla<T>(tabla);
      const indice = filas.findIndex((fila) => Object.is(fila[pk], id));
      if (indice < 0) {
        throw new Error(`No se encontró el registro ${String(id)} en ${tabla}.`);
      }

      const actualizado = { ...filas[indice], ...cambios, [pk]: id } as T;
      validar(actualizado, filas, id);
      const nuevasFilas = [...filas];
      nuevasFilas[indice] = actualizado;
      escribirTabla(tabla, nuevasFilas);
      return actualizado;
    },

    async eliminar(id: T[PK]): Promise<void> {
      const filas = leerTabla<T>(tabla);
      const indice = filas.findIndex((fila) => Object.is(fila[pk], id));
      if (indice < 0) {
        throw new Error(`No se encontró el registro ${String(id)} en ${tabla}.`);
      }

      for (const dependiente of opciones.dependientes ?? []) {
        if (!existeTabla(dependiente.tabla)) {
          continue;
        }
        const filasDependientes = leerTabla<Record<string, unknown>>(dependiente.tabla);
        if (filasDependientes.some((fila) => Object.is(fila[dependiente.campo], id))) {
          throw new Error(`No se puede eliminar: hay registros relacionados en ${dependiente.tabla}.`);
        }
      }

      escribirTabla(tabla, filas.filter((_, indiceFila) => indiceFila !== indice));
    },
  };
};
