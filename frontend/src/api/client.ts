const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API ${status}`);
    this.status = status;
    this.body = body;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  shopSlug?: string | null;
};

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, shopSlug, headers: headersInit, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();
  const headers = new Headers(headersInit);

  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD"].includes(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) headers.set("X-CSRFToken", csrf);
  }
  if (shopSlug) headers.set("X-Shop-Slug", shopSlug);

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errBody: unknown = null;
    try {
      errBody = await res.json();
    } catch {
      /* ігноруємо */
    }
    throw new ApiError(res.status, errBody);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export async function ensureCsrf(): Promise<void> {
  await fetch(`${API_BASE}/auth/csrf/`, { credentials: "include" });
}
