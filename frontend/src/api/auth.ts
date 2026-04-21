import type { User } from "@/types";
import { apiFetch } from "./client";

export function signup(data: { email: string; password: string; full_name?: string }) {
  return apiFetch<User>("/auth/signup/", { method: "POST", body: data });
}

export function login(data: { email: string; password: string }) {
  return apiFetch<User>("/auth/login/", { method: "POST", body: data });
}

export function logout() {
  return apiFetch<null>("/auth/logout/", { method: "POST" });
}

export function fetchMe() {
  return apiFetch<User>("/auth/me/");
}

export function updateMe(data: { full_name?: string; language?: string }) {
  return apiFetch<User>("/auth/me/", { method: "PATCH", body: data });
}
