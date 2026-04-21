import type { Discount, DiscountInput, DiscountValidateResult } from "@/types";
import { apiFetch } from "./client";

export function listDiscounts(shopSlug: string) {
  return apiFetch<Discount[]>("/discounts/", { shopSlug });
}

export function createDiscount(shopSlug: string, data: DiscountInput) {
  return apiFetch<Discount>("/discounts/", { method: "POST", body: data, shopSlug });
}

export function updateDiscount(shopSlug: string, id: number, data: Partial<DiscountInput>) {
  return apiFetch<Discount>(`/discounts/${id}/`, { method: "PATCH", body: data, shopSlug });
}

export function deleteDiscount(shopSlug: string, id: number) {
  return apiFetch<null>(`/discounts/${id}/`, { method: "DELETE", shopSlug });
}

export function validateDiscount(shopSlug: string, code: string, subtotal: string) {
  return apiFetch<DiscountValidateResult>("/discounts/validate/", {
    method: "POST",
    body: { code, subtotal },
    shopSlug,
  });
}
