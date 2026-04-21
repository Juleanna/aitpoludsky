import type { Customer, CustomerInput } from "@/types";
import { apiFetch } from "./client";

export function listCustomers(shopSlug: string) {
  return apiFetch<Customer[]>("/customers/", { shopSlug });
}

export function createCustomer(shopSlug: string, data: CustomerInput) {
  return apiFetch<Customer>("/customers/", { method: "POST", body: data, shopSlug });
}

export function updateCustomer(shopSlug: string, id: number, data: Partial<CustomerInput>) {
  return apiFetch<Customer>(`/customers/${id}/`, { method: "PATCH", body: data, shopSlug });
}

export function deleteCustomer(shopSlug: string, id: number) {
  return apiFetch<null>(`/customers/${id}/`, { method: "DELETE", shopSlug });
}
