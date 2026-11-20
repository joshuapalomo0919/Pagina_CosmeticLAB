import type { SqlDate, SqlDateTime } from '../types/modelos';

const monedaCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export const formatearMoneda = (valor: number): string => monedaCOP.format(valor);

export const formatearFecha = (sql: string, idioma: 'es' | 'en'): string => {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(sql);
  if (!coincidencia) {
    throw new RangeError(`Fecha SQL inválida: ${sql}`);
  }

  const [, anio, mes, dia, hora, minuto] = coincidencia;
  const fecha = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
    Number(hora ?? 0),
    Number(minuto ?? 0),
  );
  if (
    fecha.getFullYear() !== Number(anio)
    || fecha.getMonth() !== Number(mes) - 1
    || fecha.getDate() !== Number(dia)
  ) {
    throw new RangeError(`Fecha SQL inválida: ${sql}`);
  }

  const opciones: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  if (hora !== undefined) {
    opciones.hour = '2-digit';
    opciones.minute = '2-digit';
  }

  return new Intl.DateTimeFormat(idioma === 'es' ? 'es-CO' : 'en-US', opciones).format(fecha);
};

export const ahoraSQL = (): SqlDateTime => {
  const ahora = new Date();
  const dosDigitos = (valor: number): string => String(valor).padStart(2, '0');
  const fecha: SqlDate = `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`;
  return `${fecha} ${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}:${dosDigitos(ahora.getSeconds())}`;
};
