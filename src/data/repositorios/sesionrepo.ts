interface SesionGuardada {
  id_usuario: number;
}

const CLAVE_SESION = 'cosmeticlab_session';

const almacenamiento = (): Storage => {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('El almacenamiento local no está disponible.');
  }
  return window.localStorage;
};

export const leerSesion = async (): Promise<SesionGuardada | null> => {
  const contenido = almacenamiento().getItem(CLAVE_SESION);
  if (contenido === null) {
    return null;
  }

  let sesion: unknown;
  try {
    sesion = JSON.parse(contenido);
  } catch (error) {
    const detalle = error instanceof Error ? ` ${error.message}` : '';
    throw new Error(`La sesión guardada no es válida.${detalle}`);
  }

  if (
    typeof sesion !== 'object'
    || sesion === null
    || !('id_usuario' in sesion)
    || typeof sesion.id_usuario !== 'number'
    || !Number.isSafeInteger(sesion.id_usuario)
  ) {
    throw new Error('La sesión guardada tiene un identificador de usuario inválido.');
  }
  return { id_usuario: sesion.id_usuario };
};

export const guardarSesion = async (idUsuario: number): Promise<void> => {
  almacenamiento().setItem(CLAVE_SESION, JSON.stringify({ id_usuario: idUsuario }));
};

export const borrarSesion = async (): Promise<void> => {
  almacenamiento().removeItem(CLAVE_SESION);
};
