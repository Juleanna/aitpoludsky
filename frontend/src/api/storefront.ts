import type { Currency, ProductTranslations } from "@/types";
import { apiFetch } from "./client";

export type PublicShop = {
  name: string;
  slug: string;
  currency: Currency;
  default_language: string;
  languages: string[];
};

export type PublicProduct = {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: string;
  translations: ProductTranslations;
};

export function getPublicShop(slug: string) {
  return apiFetch<PublicShop>(`/public/${slug}/`);
}

export function listPublicProducts(slug: string) {
  return apiFetch<PublicProduct[]>(`/public/${slug}/products/`);
}
