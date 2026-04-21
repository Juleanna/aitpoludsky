import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as catalogApi from "@/api/catalog";
import * as discountsApi from "@/api/discounts";
import * as ordersApi from "@/api/orders";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { DiscountValidateResult, Order, OrderChannel, OrderInput, OrderItemInput, OrderStatus, Product } from "@/types";
import { formatMoney } from "@/utils/format";

const STATUSES: OrderStatus[] = ["draft", "pending", "paid", "shipped", "completed", "cancelled"];
const CHANNELS: OrderChannel[] = ["online", "pos", "manual"];

const STATUS_CHIP: Record<OrderStatus, string> = {
  draft: "chip",
  pending: "chip warn",
  paid: "chip ok",
  shipped: "chip accent",
  completed: "chip ok",
  cancelled: "chip err",
};

export function OrdersPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Order | "new" | null>(null);

  const slug = activeShop?.slug ?? null;

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      setOrders(await ordersApi.listOrders(slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [slug, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleDelete(id: number) {
    if (!slug) return;
    if (!confirm(t("orders.deleteConfirm"))) return;
    await ordersApi.deleteOrder(slug, id);
    await reload();
  }

  if (!activeShop) {
    return (
      <div className="content">
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <p>{t("shops.firstNeedShop")}</p>
          <Link to="/shops" className="btn accent">
            {t("shops.goShops")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t("orders.title")}</h1>
          <p className="page-sub">{t("orders.subtitle", { shop: activeShop.name, count: orders.length })}</p>
        </div>
        <button className="btn accent" onClick={() => setEditing("new")}>
          <Icon name="plus" size={14} /> {t("orders.newOrder")}
        </button>
      </div>

      {error && <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>{error}</div>}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("orders.colNumber")}</th>
              <th>{t("orders.colChannel")}</th>
              <th>{t("orders.colStatus")}</th>
              <th className="num">{t("orders.colAmount")}</th>
              <th>{t("orders.colDate")}</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => setEditing(o)}>
                <td>
                  <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {o.number}
                  </div>
                  <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                </td>
                <td>
                  <span className="chip">{t(`orders.channels.${o.channel}`)}</span>
                </td>
                <td>
                  <span className={STATUS_CHIP[o.status]}>
                    <span className="dot" />
                    {t(`orders.statuses.${o.status}`)}
                  </span>
                </td>
                <td className="num">{formatMoney(o.total, activeShop.currency)}</td>
                <td style={{ color: "var(--text-3)", fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn ghost icon" onClick={() => handleDelete(o.id)} aria-label={t("common.delete")} title={t("common.delete")}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("orders.empty")}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("common.loading")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && slug && (
        <OrderDrawer
          shopSlug={slug}
          order={editing === "new" ? null : editing}
          currency={activeShop.currency}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

type DrawerProps = {
  shopSlug: string;
  order: Order | null;
  currency: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

type LineDraft = { product_id: number | null; quantity: number };

function OrderDrawer({ shopSlug, order, currency, onClose, onSaved }: DrawerProps) {
  const { t } = useTranslation();
  const isEdit = order !== null;
  const [customerName, setCustomerName] = useState(order?.customer_name ?? "");
  const [customerPhone, setCustomerPhone] = useState(order?.customer_phone ?? "");
  const [customerEmail, setCustomerEmail] = useState(order?.customer_email ?? "");
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "pending");
  const [channel, setChannel] = useState<OrderChannel>(order?.channel ?? "manual");
  const [note, setNote] = useState(order?.note ?? "");
  const [lines, setLines] = useState<LineDraft[]>(
    order
      ? order.items.map((it) => ({ product_id: it.product, quantity: it.quantity }))
      : [{ product_id: null, quantity: 1 }],
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [promoCode, setPromoCode] = useState(order?.discount_code ?? "");
  const [promoResult, setPromoResult] = useState<DiscountValidateResult | null>(
    order?.discount_code
      ? {
          valid: true,
          code: order.discount_code,
          name: "",
          kind: "percent",
          value: "0",
          discount_amount: order.discount_amount,
          new_total: order.total,
        }
      : null,
  );
  const [promoBusy, setPromoBusy] = useState(false);

  useEffect(() => {
    void catalogApi.listProducts(shopSlug).then(setProducts).catch(() => setProducts([]));
  }, [shopSlug]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      if (l.product_id == null) return sum;
      const p = productById.get(l.product_id);
      if (!p) return sum;
      return sum + Number(p.price) * l.quantity;
    }, 0);
  }, [lines, productById]);

  function updateLine(idx: number, patch: Partial<LineDraft>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }
  function addLine() {
    setLines((ls) => [...ls, { product_id: null, quantity: 1 }]);
  }

  async function applyPromo() {
    const code = promoCode.trim();
    if (!code) {
      setPromoResult(null);
      return;
    }
    setPromoBusy(true);
    try {
      const res = await discountsApi.validateDiscount(shopSlug, code, String(subtotal));
      setPromoResult(res);
    } catch {
      setPromoResult({ valid: false, error: t("discounts.invalid") });
    } finally {
      setPromoBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const items: OrderItemInput[] = lines
      .filter((l) => l.product_id != null && l.quantity > 0)
      .map((l) => ({ product_id: l.product_id as number, quantity: l.quantity }));

    if (items.length === 0) {
      setFieldErrors({ items: t("orders.mustHaveItem") });
      return;
    }

    const payload: OrderInput = {
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      customer_email: customerEmail || undefined,
      status,
      channel,
      note: note || undefined,
      items,
      discount_code_input: promoResult && promoResult.valid ? promoCode : "",
    };

    setBusy(true);
    try {
      if (isEdit && order) {
        await ordersApi.updateOrder(shopSlug, order.id, payload);
      } else {
        await ordersApi.createOrder(shopSlug, payload);
      }
      await onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = (err.body ?? {}) as Record<string, unknown>;
        const errs: Record<string, string> = {};
        for (const [k, v] of Object.entries(body)) {
          if (Array.isArray(v) && typeof v[0] === "string") errs[k] = v[0];
          else if (typeof v === "string") errs[k] = v;
        }
        setFieldErrors(errs);
      } else {
        setFieldErrors({ _: t("orders.saveError") });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} style={{ width: 560 }}>
        <header className="drawer-head">
          <div>
            <h2 className="serif" style={{ margin: 0, fontSize: 24, fontStyle: "italic" }}>
              {isEdit && order ? t("orders.editOrder", { number: order.number }) : t("orders.newOrder")}
            </h2>
            {isEdit && order && (
              <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                {new Date(order.created_at).toLocaleString()}
              </div>
            )}
          </div>
          <button className="btn ghost icon" onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>
        </header>
        <form onSubmit={handleSubmit} className="drawer-body">
          <Field label={t("orders.customer")} error={fieldErrors.customer_name}>
            <input value={customerName} required onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={t("orders.phone")} error={fieldErrors.customer_phone}>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={inputStyle} />
            </Field>
            <Field label={t("orders.email")} error={fieldErrors.customer_email}>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={t("orders.status")}>
              <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} style={inputStyle}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`orders.statuses.${s}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("orders.channel")}>
              <select value={channel} onChange={(e) => setChannel(e.target.value as OrderChannel)} style={inputStyle}>
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {t(`orders.channels.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>
              {t("orders.items")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map((line, idx) => {
                const product = line.product_id != null ? productById.get(line.product_id) : null;
                const lineTotal = product ? Number(product.price) * line.quantity : 0;
                return (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 28px", gap: 8, alignItems: "center" }}>
                    <select
                      value={line.product_id ?? ""}
                      onChange={(e) => updateLine(idx, { product_id: e.target.value ? Number(e.target.value) : null })}
                      style={inputStyle}
                    >
                      <option value="">{t("orders.selectProduct")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) · {formatMoney(p.price, currency)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                      style={{ ...inputStyle, fontFamily: "var(--font-mono)", textAlign: "right" }}
                    />
                    <div className="mono" style={{ textAlign: "right", fontSize: 13 }}>
                      {formatMoney(String(lineTotal), currency)}
                    </div>
                    <button type="button" className="btn ghost icon" onClick={() => removeLine(idx)} aria-label={t("common.delete")}>
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <button type="button" className="btn ghost" onClick={addLine} style={{ marginTop: 8 }}>
              <Icon name="plus" size={12} /> {t("orders.addItem")}
            </button>
            {fieldErrors.items && <div style={{ color: "var(--err)", fontSize: 12, marginTop: 6 }}>{fieldErrors.items}</div>}
          </div>

          <Field label={t("orders.note")}>
            <textarea value={note} rows={2} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8, alignItems: "end" }}>
            <Field label={t("discounts.promoCode")}>
              <input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  if (promoResult) setPromoResult(null);
                }}
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              />
            </Field>
            <button
              type="button"
              className="btn"
              onClick={applyPromo}
              disabled={promoBusy}
              style={{ justifyContent: "center" }}
            >
              {promoBusy ? "…" : t("discounts.apply")}
            </button>
          </div>
          {promoResult && !promoResult.valid && (
            <div style={{ color: "var(--err)", fontSize: 12 }}>{promoResult.error}</div>
          )}

          <div style={{ padding: "10px 0", borderTop: "1px dashed var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-2)", padding: "2px 0" }}>
              <span className="mono">{t("orderDrawer.subtotal")}</span>
              <span className="mono">{formatMoney(String(subtotal), currency)}</span>
            </div>
            {promoResult && promoResult.valid && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ok)", padding: "2px 0" }}>
                <span className="mono">
                  {t("orderDrawer.discountLine")} ({promoResult.code})
                </span>
                <span className="mono">−{formatMoney(promoResult.discount_amount, currency)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.1em" }}>
                {t("orderDrawer.totalAfter")}
              </span>
              <span className="serif" style={{ fontSize: 28 }}>
                {formatMoney(
                  promoResult && promoResult.valid ? promoResult.new_total : String(subtotal),
                  currency,
                )}
              </span>
            </div>
          </div>

          {fieldErrors._ && <div style={{ color: "var(--err)", fontSize: 12 }}>{fieldErrors._}</div>}

          <footer className="drawer-foot">
            <button type="button" className="btn" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn accent" disabled={busy}>
              {busy ? t("common.saving") : t("common.save")}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)" }}>
        {label.toUpperCase()}
      </span>
      {children}
      {error && <span style={{ fontSize: 12, color: "var(--err)" }}>{error}</span>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 11px",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-sm)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
  width: "100%",
};
