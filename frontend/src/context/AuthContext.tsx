import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types/movie";
import { sampleUsers } from "../data/sample-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    const found = sampleUsers.find((u) => u.email === email);
    if (found) {
      setAuthState({ user: found, isAuthenticated: true });
      return true;
    }
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string): Promise<boolean> => {
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
