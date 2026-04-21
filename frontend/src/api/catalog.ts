import type { Product, ProductInput } from "@/types";
import { apiFetch } from "./client";

export function listProducts(shopSlug: string) {
  return apiFetch<Product[]>("/catalog/products/", { shopSlug });
}

export function createProduct(shopSlug: string, data: ProductInput) {
  return apiFetch<Product>("/catalog/products/", { method: "POST", body: data, shopSlug });
}

export function updateProduct(shopSlug: string, id: number, data: Partial<ProductInput>) {
  return apiFetch<Product>(`/catalog/products/${id}/`, { method: "PATCH", body: data, shopSlug });
}

export function deleteProduct(shopSlug: string, id: number) {
  return apiFetch<null>(`/catalog/products/${id}/`, { method: "DELETE", shopSlug });
}
