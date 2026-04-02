import axios, { type AxiosError } from "axios";

/**
 * Browser client: requests go to same-origin proxy `/api/django/*`
 * which attaches the HttpOnly JWT from login.
 */
export const apiClient = axios.create({
  baseURL: "/api/django",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export function isAxiosError(e: unknown): e is AxiosError {
  return axios.isAxiosError(e);
}

export function getErrorMessage(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const data = e.response?.data as Record<string, unknown> | string | undefined;
    if (data && typeof data === "object") {
      const detail = data.detail ?? data.message ?? data.non_field_errors;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail) && detail[0]) return String(detail[0]);
    }
    if (typeof data === "string" && data.length) return data;
    if (e.message) return e.message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
