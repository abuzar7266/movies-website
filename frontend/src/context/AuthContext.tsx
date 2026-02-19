import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "../types/movie";
import { loadJSON, saveJSON } from "../lib/utils";
import { STORAGE_AUTH } from "../lib/keys";
import { api, ApiError } from "../lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; reason?: "not_found" | "wrong_password" }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (dataUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(() => loadJSON<AuthState>(STORAGE_AUTH, { user: null, isAuthenticated: false }));
  useEffect(() => {
    if (authState.isAuthenticated) {
      saveJSON(STORAGE_AUTH, authState);
    } else {
      localStorage.removeItem(STORAGE_AUTH);
    }
  }, [authState]);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; reason?: "not_found" | "wrong_password" }> => {
    try {
      const resp = await api.post<{ success: true; data: { id: string; name: string; email: string; role: string } }>("/auth/login", { email, password });
      const u: User = {
        id: resp.data.id,
        name: resp.data.name,
        email: resp.data.email,
        createdAt: new Date().toISOString(),
      };
      setAuthState({ user: u, isAuthenticated: true });
      return { ok: true };
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return { ok: false, reason: "wrong_password" };
      return { ok: false, reason: "not_found" };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const resp = await api.post<{ success: true; data: { id: string; name: string; email: string; role: string } }>("/auth/register", { name, email, password });
      const u: User = {
        id: resp.data.id,
        name: resp.data.name,
        email: resp.data.email,
        createdAt: new Date().toISOString(),
      };
      setAuthState({ user: u, isAuthenticated: true });
      return true;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) return false;
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem(STORAGE_AUTH);
    setAuthState({ user: null, isAuthenticated: false });
  }, []);

  const updateAvatar = useCallback((dataUrl: string) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      const nextUser = { ...prev.user, avatarUrl: dataUrl };
      return { ...prev, user: nextUser };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const persisted = loadJSON<AuthState>(STORAGE_AUTH, { user: null, isAuthenticated: false });
      if (!persisted.isAuthenticated) {
        if (!cancelled) setAuthState({ user: null, isAuthenticated: false });
        return;
      }
      try {
        const me = await api.get<{ success: true; data: { id: string; name: string; email: string } }>("/users/me", { silentError: true });
        if (cancelled) return;
        setAuthState(prev => ({
          user: {
            id: me.data.id,
            name: me.data.name,
            email: me.data.email,
            avatarUrl: prev.user?.avatarUrl,
            createdAt: prev.user?.createdAt ?? new Date().toISOString(),
          },
          isAuthenticated: true,
        }));
        return;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          const refreshOk = await (async (): Promise<boolean> => {
            try {
              await api.post<unknown>("/auth/refresh", undefined, { silentError: true });
              return true;
            } catch {
              return false;
            }
          })();
          if (refreshOk) {
            try {
              const me2 = await api.get<{ success: true; data: { id: string; name: string; email: string } }>("/users/me", { silentError: true });
              if (cancelled) return;
              setAuthState(prev => ({
                user: {
                  id: me2.data.id,
                  name: me2.data.name,
                  email: me2.data.email,
                  avatarUrl: prev.user?.avatarUrl,
                  createdAt: prev.user?.createdAt ?? new Date().toISOString(),
                },
                isAuthenticated: true,
              }));
              return;
            } catch {
              void 0;
            }
          }
        }
        return;
      }
      if (!cancelled) setAuthState({ user: null, isAuthenticated: false });
    };
    restore();
    return () => { cancelled = true };
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
