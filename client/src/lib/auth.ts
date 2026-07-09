import { apiFetch, ApiError, setToken } from "./api";
import type { User } from "./types";

interface AuthResponse {
  token: string;
  user: User;
}

export async function signUp(
  username: string,
  displayName: string,
  password: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const { token, user } = await apiFetch<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, displayName, password }),
    });
    setToken(token);
    return { ok: true, user };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Couldn't reach the server. Is it running?" };
  }
}

export async function logIn(
  username: string,
  password: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  try {
    const { token, user } = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(token);
    return { ok: true, user };
  } catch (e) {
    return { ok: false, error: e instanceof ApiError ? e.message : "Couldn't reach the server. Is it running?" };
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { user } = await apiFetch<{ user: User }>("/api/auth/me");
    return user;
  } catch {
    return null;
  }
}
