import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "../types/movie";
import { loadJSON, saveJSON } from "../lib/utils";
import { STORAGE_AUTH } from "../lib/keys";
import { ApiError, apiUrl, authApi, mediaApi, usersApi } from "../api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; reason?: "not_found" | "wrong_password" }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (file: File) => Promise<boolean>;
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
      const resp = await authApi.login(email, password);
      const u: User = {
        id: resp.data.id,
        name: resp.data.name,
        email: resp.data.email,
        role: resp.data.role,
        createdAt: new Date().toISOString(),
      };
      setAuthState({ user: u, isAuthenticated: true });
      void usersApi.me().then(
        (me) => {
          setAuthState((prev) => {
            if (!prev.user) return prev;
            const avatarMediaId = me.data.avatarMediaId ?? null;
            return {
              ...prev,
              user: {
                ...prev.user,
                id: me.data.id,
                name: me.data.name,
                email: me.data.email,
                role: me.data.role,
                avatarMediaId,
                avatarUrl: avatarMediaId ? apiUrl(`/media/${avatarMediaId}`) : undefined,
              },
            };
          });
        },
        () => {}
      );
      return { ok: true };
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return { ok: false, reason: "wrong_password" };
      return { ok: false, reason: "not_found" };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const resp = await authApi.register(name, email, password);
      const u: User = {
        id: resp.data.id,
        name: resp.data.name,
        email: resp.data.email,
        role: resp.data.role,
        createdAt: new Date().toISOString(),
      };
      setAuthState({ user: u, isAuthenticated: true });
      void usersApi.me().then(
        (me) => {
          setAuthState((prev) => {
            if (!prev.user) return prev;
            const avatarMediaId = me.data.avatarMediaId ?? null;
            return {
              ...prev,
              user: {
                ...prev.user,
                id: me.data.id,
                name: me.data.name,
                email: me.data.email,
                role: me.data.role,
                avatarMediaId,
                avatarUrl: avatarMediaId ? apiUrl(`/media/${avatarMediaId}`) : undefined,
              },
            };
          });
        },
        () => {}
      );
      return true;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) return false;
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem(STORAGE_AUTH);
    setAuthState({ user: null, isAuthenticated: false });
  }, []);

  const updateAvatar = useCallback(async (file: File): Promise<boolean> => {
    if (!file) return false;

    const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    if (!allowed.has(file.type)) return false;
    if (file.size > 2 * 1024 * 1024) return false;

    try {
      const uploadRes = await mediaApi.upload(file);
      const updated = await usersApi.updateAvatar(uploadRes.data.id);
      const avatarMediaId = updated.data.avatarMediaId ?? null;
      setAuthState((prev) => {
        if (!prev.user) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            id: updated.data.id,
            name: updated.data.name,
            email: updated.data.email,
            role: updated.data.role,
            avatarMediaId,
            avatarUrl: avatarMediaId ? apiUrl(`/media/${avatarMediaId}`) : undefined,
          },
        };
      });
      return true;
    } catch {
      return false;
    }
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
        const me = await usersApi.me();
        if (cancelled) return;
        const avatarMediaId = me.data.avatarMediaId ?? null;
        setAuthState(prev => ({
          user: {
            id: me.data.id,
            name: me.data.name,
            email: me.data.email,
            role: me.data.role,
            avatarMediaId,
            avatarUrl: avatarMediaId ? apiUrl(`/media/${avatarMediaId}`) : undefined,
            createdAt: prev.user?.createdAt ?? new Date().toISOString(),
          },
          isAuthenticated: true,
        }));
        return;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          const refreshOk = await (async (): Promise<boolean> => {
            try {
              await authApi.refresh();
              return true;
            } catch {
              return false;
            }
          })();
          if (refreshOk) {
            try {
              const me2 = await usersApi.me();
              if (cancelled) return;
              const avatarMediaId = me2.data.avatarMediaId ?? null;
              setAuthState(prev => ({
                user: {
                  id: me2.data.id,
                  name: me2.data.name,
                  email: me2.data.email,
                  role: me2.data.role,
                  avatarMediaId,
                  avatarUrl: avatarMediaId ? apiUrl(`/media/${avatarMediaId}`) : undefined,
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
