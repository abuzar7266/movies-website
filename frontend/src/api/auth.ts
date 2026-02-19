import type { Envelope } from "../types/api";
import { api } from "./client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function login(email: string, password: string): Promise<Envelope<AuthUser>> {
  return api.post<Envelope<AuthUser>>("/auth/login", { email, password });
}

export async function register(name: string, email: string, password: string): Promise<Envelope<AuthUser>> {
  return api.post<Envelope<AuthUser>>("/auth/register", { name, email, password });
}

export async function logout(): Promise<unknown> {
  return api.post("/auth/logout");
}

export async function refresh(): Promise<unknown> {
  return api.post("/auth/refresh", undefined, { silentError: true });
}
