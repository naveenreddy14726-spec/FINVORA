import { getSupabase } from "./supabase";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

// Calls the FastAPI backend with the user's access token.
// The backend is the real authority: the frontend only reflects its answers.
export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, message: body?.detail?.message ?? "Request failed." };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, status: 0, message: `Backend not reachable at ${API_URL}.` };
  }
}
