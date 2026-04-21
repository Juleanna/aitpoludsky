import type { Category, CategoryInput, Product, ProductImage, ProductInput } from "@/types";
import { apiFetch, apiUpload } from "./client";

export function listProducts(shopSlug: string) {
  return apiFetch<Product[]>("/catalog/products/", { shopSlug });
}

// ── Категорії (shop-scoped CRUD) ──────────────────────────

export function listCategories(shopSlug: string) {
  return apiFetch<Category[]>("/catalog/categories/", { shopSlug });
}

export function createCategory(shopSlug: string, data: CategoryInput) {
  return apiFetch<Category>("/catalog/categories/", { method: "POST", body: data, shopSlug });
}

export function updateCategory(shopSlug: string, id: number, data: Partial<CategoryInput>) {
  return apiFetch<Category>(`/catalog/categories/${id}/`, { method: "PATCH", body: data, shopSlug });
}

export function deleteCategory(shopSlug: string, id: number) {
  return apiFetch<null>(`/catalog/categories/${id}/`, { method: "DELETE", shopSlug });
}

export function createProduct(shopSlug: string, data: ProductInput) {
  return apiFetch<Product>("/catalog/products/", { method: "POST", body: data, shopSlug });
}

export function getProduct(shopSlug: string, id: number) {
  return apiFetch<Product>(`/catalog/products/${id}/`, { shopSlug });
}

export function updateProduct(shopSlug: string, id: number, data: Partial<ProductInput>) {
  return apiFetch<Product>(`/catalog/products/${id}/`, { method: "PATCH", body: data, shopSlug });
}

export function deleteProduct(shopSlug: string, id: number) {
  return apiFetch<null>(`/catalog/products/${id}/`, { method: "DELETE", shopSlug });
}

// ── Зображення товару (multipart upload) ────────────────────

export function uploadProductImage(
  shopSlug: string,
  productId: number,
  file: File,
  alt?: string,
) {
  const fd = new FormData();
  fd.append("image", file);
  if (alt) fd.append("alt", alt);
  return apiUpload<ProductImage>(
    `/catalog/products/${productId}/images/`,
    fd,
    { shopSlug },
  );
}

export function deleteProductImage(shopSlug: string, productId: number, imageId: number) {
  return apiFetch<null>(`/catalog/products/${productId}/images/${imageId}/`, {
    method: "DELETE",
    shopSlug,
  });
}

export function setPrimaryProductImage(shopSlug: string, productId: number, imageId: number) {
  return apiFetch<ProductImage>(
    `/catalog/products/${productId}/images/${imageId}/set-primary/`,
    { method: "POST", shopSlug },
  );
}

export function reorderProductImages(shopSlug: string, productId: number, ids: number[]) {
  return apiFetch<null>(`/catalog/products/${productId}/images/reorder/`, {
    method: "PATCH",
    body: { ids },
    shopSlug,
  });
}
