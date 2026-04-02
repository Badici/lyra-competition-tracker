/** Unwrap Django REST list: either T[] or { results: T[] } */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export function unwrapDetail<T>(data: unknown): T | null {
  if (data && typeof data === "object") return data as T;
  return null;
}
