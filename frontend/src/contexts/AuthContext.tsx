"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser, login as apiLogin, register as apiRegister } from "../lib/api";

export type UserRole = "admin" | "teacher" | "student";

export interface User {
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, role: UserRole) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "classvision_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      // Fetch user info
      fetchUserInfo(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (authToken: string) => {
    try {
      const result = await getCurrentUser(authToken);
      if (result.ok && result.data?.user) {
        setUser(result.data.user);
      } else {
        // Invalid token, clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await apiLogin(email, password);
      if (result.ok && result.token) {
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
        await fetchUserInfo(result.token);
        return { ok: true };
      } else {
        return { ok: false, error: (result as { ok: false; error: string }).error || "Login failed" };
      }
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  };

  const register = async (email: string, password: string, role: UserRole) => {
    try {
      const result = await apiRegister(email, password, role);
      if (result.ok && result.token) {
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
        await fetchUserInfo(result.token);
        return { ok: true };
      } else {
        return { ok: false, error: (result as { ok: false; error: string }).error || "Registration failed" };
      }
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

