import type { Currency } from "@/types";

export function currencySymbol(currency: Currency | string): string {
  switch (currency) {
    case "UAH":
      return "₴";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    default:
      return "";
  }
}

export function formatMoney(raw: string | number, currency: Currency | string): string {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(n)) return String(raw);
  return `${currencySymbol(currency)}${n.toLocaleString("uk", { minimumFractionDigits: 2 })}`;
}

export function formatInt(raw: string | number): string {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(n)) return String(raw);
  return n.toLocaleString("uk");
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "щойно";
  if (min < 60) return `${min} хв тому`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} год тому`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} дн тому`;
  return d.toLocaleDateString("uk");
}
