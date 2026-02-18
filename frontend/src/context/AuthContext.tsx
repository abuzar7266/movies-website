import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "../types/movie";
import { sampleUsers } from "../data/sample-data";
import { loadJSON, saveJSON } from "../lib/utils";
import { STORAGE_AUTH, STORAGE_USERS } from "../lib/keys";

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
  const persisted = loadJSON<AuthState>(STORAGE_AUTH, { user: null, isAuthenticated: false });
  const [authState, setAuthState] = useState<AuthState>(persisted);
  useEffect(() => { saveJSON(STORAGE_AUTH, authState) }, [authState]);

  type StoredUser = { id: string; name: string; email: string; avatarUrl?: string; createdAt: string; password: string };
  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; reason?: "not_found" | "wrong_password" }> => {
    const store = loadJSON<StoredUser[]>(STORAGE_USERS, []);
    const fixed = [
      { email: "alex@example.com", password: "password123" },
      { email: "sam@example.com", password: "password123" },
      { email: "jordan@example.com", password: "password123" },
    ];
    const user = sampleUsers.find((u) => u.email === email) || store.find((u) => u.email === email);
    if (!user) return { ok: false, reason: "not_found" };
    const ok =
      (fixed.find((c) => c.email === email && c.password === password) !== undefined) ||
      (store.find((u) => u.email === email && u.password === password) !== undefined);
    if (!ok) return { ok: false, reason: "wrong_password" };
    const asUser: User = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt };
    setAuthState({ user: asUser, isAuthenticated: true });
    return { ok: true };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    if (sampleUsers.find((u) => u.email === email)) return false;
    const users = loadJSON<StoredUser[]>(STORAGE_USERS, []);
    if (users.find((u) => u.email === email)) return false;
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
      createdAt: new Date().toISOString(),
      password,
    };
    users.push(newUser);
    saveJSON(STORAGE_USERS, users);
    setAuthState({ user: { id: newUser.id, name, email, avatarUrl: newUser.avatarUrl, createdAt: newUser.createdAt }, isAuthenticated: true });
    return true;
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, isAuthenticated: false });
  }, []);

  const updateAvatar = useCallback((dataUrl: string) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      const nextUser = { ...prev.user, avatarUrl: dataUrl };
      const users = loadJSON<StoredUser[]>(STORAGE_USERS, []);
      const idx = users.findIndex(u => u.id === nextUser.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], avatarUrl: dataUrl };
        saveJSON(STORAGE_USERS, users);
      }
      return { ...prev, user: nextUser };
    });
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
