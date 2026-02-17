import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types/movie";
import { sampleUsers } from "../data/sample-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; reason?: "not_found" | "wrong_password" }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; reason?: "not_found" | "wrong_password" }> => {
    const creds = [
      { email: "alex@example.com", password: "password123" },
      { email: "sam@example.com", password: "password123" },
      { email: "jordan@example.com", password: "password123" },
    ];
    const user = sampleUsers.find((u) => u.email === email);
    if (!user) return { ok: false, reason: "not_found" };
    const match = creds.find((c) => c.email === email && c.password === password);
    if (!match) return { ok: false, reason: "wrong_password" };
    setAuthState({ user, isAuthenticated: true });
    return { ok: true };
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string): Promise<boolean> => {
    void _password;
    if (sampleUsers.find((u) => u.email === email)) {
      return false;
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
      createdAt: new Date().toISOString(),
    };
    sampleUsers.push(newUser);
    setAuthState({ user: newUser, isAuthenticated: true });
    return true;
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
