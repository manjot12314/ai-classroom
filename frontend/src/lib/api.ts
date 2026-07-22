const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const TOKEN_KEY = "classvision_token";

type ApiResult<T> = { ok: true; data: T; token?: string } | { ok: false; error: string };

// Type definitions for API entities
export interface Class {
  id: number;
  name: string;
  schedule: string | null;
  teacher_id: number;
  created_at: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  class_id: number;
  face_encoding: any;
  created_at: string;
}

export interface Session {
  id: number;
  class_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

export interface Attendance {
  id: number;
  session_id: number;
  student_id: number;
  detected_at: string;
  confidence_score: number;
}

export interface Attentiveness {
  id: number;
  session_id: number;
  student_id: number;
  timestamp: string;
  score: number;
  head_pose: string | null;
  eye_state: string | null;
}

export interface VoiceAnalytics {
  id: number;
  session_id: number;
  timestamp: string;
  activity_level: number;
  clarity_score: number;
  speaking_pattern: string | null;
}

export interface Report {
  id: number;
  session_id: number;
  generated_at: string;
  attendance_summary: any;
  engagement_metrics: any;
  report_data: any;
}

export interface Performance {
  attendance_rate: number;
  avg_attentiveness: number;
  overall_score: number;
}

// Helper to get token from localStorage
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Helper to create headers with auth token
function getAuthHeaders(token?: string | null): Record<string, string> {
  const authToken = token || getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

export interface User {
  email: string;
  role: "admin" | "teacher" | "student";
}

export async function login(email: string, password: string): Promise<ApiResult<unknown> & { token?: string }> {
  try {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.detail || "Login failed" };
    return { ok: true, data: json, token: json.access_token };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function register(
  email: string,
  password: string,
  role: "admin" | "teacher" | "student" = "teacher"
): Promise<ApiResult<unknown> & { token?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.detail || "Registration failed" };
    return { ok: true, data: json, token: json.access_token };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function getCurrentUser(token?: string | null): Promise<ApiResult<{ user: User }>> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.detail || "Failed to get user info" };
    return { ok: true, data: { user: json as User } };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

// Legacy function for backward compatibility
export async function authenticate(email: string, password: string): Promise<ApiResult<unknown> & { token?: string }> {
  return login(email, password);
}

export async function getHealth(): Promise<ApiResult<unknown>> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.detail || "Health check failed" };
    return { ok: true, data: json };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function uploadFile(
  endpoint: string,
  file: File,
  fields?: Record<string, string | number>,
  token?: string | null
): Promise<ApiResult<unknown>> {
  try {
    const form = new FormData();
    form.append("file", file);
    if (fields) {
      Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));
    }
    const authToken = token || getToken();
    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      body: form,
      headers,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.detail || "Upload failed" };
    return { ok: true, data: json };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

// Generic API fetch with automatic auth
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResult<T>> {
  try {
    const authToken = token || getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    // Ensure endpoint starts with / but doesn't have double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      ...options,
      headers,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.detail || "Request failed" };
    return { ok: true, data: json as T };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

// Helper function for file uploads with better error handling
export async function uploadFileWithProgress(
  endpoint: string,
  file: File,
  fields?: Record<string, string | number>,
  token?: string | null,
  onProgress?: (progress: number) => void
): Promise<ApiResult<unknown>> {
  return uploadFile(endpoint, file, fields, token);
}

// Helper to handle API errors consistently
export function getApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

