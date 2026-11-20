import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { RegisteredUser } from '../types/modelos';
import {
  asignarRolUsuario,
  crearUsuario,
  listarUsuarios,
  obtenerRolesUsuario,
} from '../data/repositorios/usuariorepo';
import { borrarSesion, guardarSesion, leerSesion } from '../data/repositorios/sesionrepo';

interface ResultadoLogin {
  ok: boolean;
  error?: string;
  usuario?: RegisteredUser;
  roles?: number[];
}

interface AuthContextType {
  currentUser: RegisteredUser | null;
  roles: number[];
  isAdmin: boolean;
  ready: boolean;
  login: (email: string, password: string) => Promise<ResultadoLogin>;
  registrar: (datos: Omit<RegisteredUser, 'id'>) => Promise<RegisteredUser>;
  logout: () => Promise<void>;
  actualizarUsuarioActual: (usuario: RegisteredUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(null);
  const [roles, setRoles] = useState<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const restaurarSesion = async () => {
      try {
        const sesion = await leerSesion();
        if (!sesion) {
          return;
        }
        const usuarios = await listarUsuarios();
        const usuario = usuarios.find((fila) => fila.id === sesion.id_usuario);
        if (!usuario) {
          await borrarSesion();
          return;
        }
        const rolesGuardados = await obtenerRolesUsuario(usuario.id);
        if (active) {
          setCurrentUser(usuario);
          setRoles(rolesGuardados);
        }
      } catch (error) {
        console.error('No se pudo restaurar la sesión de CosmeticLAB.', error);
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };
    void restaurarSesion();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<ResultadoLogin> => {
    const usuarios = await listarUsuarios();
    const usuario = usuarios.find(
      (fila) => fila.email.trim().toLocaleLowerCase() === email.trim().toLocaleLowerCase()
        && fila.password === password,
    );
    if (!usuario) {
      return { ok: false, error: 'invalid_credentials' };
    }

    const rolesUsuario = await obtenerRolesUsuario(usuario.id);
    await guardarSesion(usuario.id);
    setCurrentUser(usuario);
    setRoles(rolesUsuario);
    return { ok: true, usuario, roles: rolesUsuario };
  }, []);

  const registrar = useCallback(async (
    datos: Omit<RegisteredUser, 'id'>,
  ): Promise<RegisteredUser> => {
    const usuario = await crearUsuario(datos);
    await asignarRolUsuario(usuario.id, 2);
    return usuario;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await borrarSesion();
    setCurrentUser(null);
    setRoles([]);
  }, []);

  const actualizarUsuarioActual = useCallback((usuario: RegisteredUser): void => {
    setCurrentUser(usuario);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    currentUser,
    roles,
    isAdmin: roles.includes(1),
    ready,
    login,
    registrar,
    logout,
    actualizarUsuarioActual,
  }), [currentUser, roles, ready, login, registrar, logout, actualizarUsuarioActual]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return context;
};
