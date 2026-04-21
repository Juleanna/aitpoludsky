import type { InboxMessage, InboxThread, InboxThreadInput } from "@/types";
import { apiFetch } from "./client";

export function listThreads(shopSlug: string) {
  return apiFetch<InboxThread[]>("/inbox/threads/", { shopSlug });
}

export function createThread(shopSlug: string, data: InboxThreadInput) {
  return apiFetch<InboxThread>("/inbox/threads/", { method: "POST", body: data, shopSlug });
}

export function getThread(shopSlug: string, id: number) {
  return apiFetch<InboxThread>(`/inbox/threads/${id}/`, { shopSlug });
}

export function replyToThread(shopSlug: string, id: number, body: string) {
  return apiFetch<InboxMessage>(`/inbox/threads/${id}/reply/`, {
    method: "POST",
    body: { body },
    shopSlug,
  });
}

export function updateThread(shopSlug: string, id: number, data: Partial<InboxThreadInput> & { unread?: boolean }) {
  return apiFetch<InboxThread>(`/inbox/threads/${id}/`, { method: "PATCH", body: data, shopSlug });
}
