import type { Order, OrderInput } from "@/types";
import { apiFetch } from "./client";

export function listOrders(shopSlug: string) {
  return apiFetch<Order[]>("/orders/", { shopSlug });
}

export function getOrder(shopSlug: string, id: number) {
  return apiFetch<Order>(`/orders/${id}/`, { shopSlug });
}

export function createOrder(shopSlug: string, data: OrderInput) {
  return apiFetch<Order>("/orders/", { method: "POST", body: data, shopSlug });
}

export function updateOrder(shopSlug: string, id: number, data: Partial<OrderInput>) {
  return apiFetch<Order>(`/orders/${id}/`, { method: "PATCH", body: data, shopSlug });
}

export function deleteOrder(shopSlug: string, id: number) {
  return apiFetch<null>(`/orders/${id}/`, { method: "DELETE", shopSlug });
}
