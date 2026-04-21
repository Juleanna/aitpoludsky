import type { DashboardSummary } from "@/types";
import { apiFetch } from "./client";

export function fetchSummary(shopSlug: string) {
  return apiFetch<DashboardSummary>("/dashboard/summary/", { shopSlug });
}
