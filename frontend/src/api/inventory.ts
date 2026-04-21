import type { StockMovement, StockMovementInput } from "@/types";
import { apiFetch } from "./client";

export function listMovements(shopSlug: string) {
  return apiFetch<StockMovement[]>("/inventory/movements/", { shopSlug });
}

export function createMovement(shopSlug: string, data: StockMovementInput) {
  return apiFetch<StockMovement>("/inventory/movements/", { method: "POST", body: data, shopSlug });
}
