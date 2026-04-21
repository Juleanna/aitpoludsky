import type { Currency, Shop } from "@/types";
import { apiFetch } from "./client";

export function listShops() {
  return apiFetch<Shop[]>("/shops/");
}

export type CreateShopInput = {
  name: string;
  slug: string;
  currency?: Currency;
  default_language?: string;
  languages?: string[];
};

export function createShop(data: CreateShopInput) {
  return apiFetch<Shop>("/shops/", { method: "POST", body: data });
}

export function getShop(slug: string) {
  return apiFetch<Shop>(`/shops/${slug}/`);
}
