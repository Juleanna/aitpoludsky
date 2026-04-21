import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as customersApi from "@/api/customers";
import { useConfirm } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Customer, CustomerInput, CustomerTier } from "@/types";
import { formatMoney, formatRelative } from "@/utils/format";

const TIERS: CustomerTier[] = ["bronze", "silver", "gold", "platinum"];

type FormState = CustomerInput & { id?: number };
const EMPTY: FormState = { name: "", email: "", phone: "", tier: "bronze", note: "" };

export function CustomersPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const ask = useConfirm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const slug = activeShop?.slug ?? null;

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      setCustomers(await customersApi.listCustomers(slug));
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
    const ok = await ask({
      title: t("customers.deleteConfirm"),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    await customersApi.deleteCustomer(slug, id);
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
          <h1 className="page-title">{t("customers.title")}</h1>
          <p className="page-sub">{t("customers.subtitle", { shop: activeShop.name, count: customers.length })}</p>
        </div>
        <button className="btn accent" onClick={() => setForm({ ...EMPTY })}>
          <Icon name="plus" size={14} /> {t("customers.newCustomer")}
        </button>
      </div>

      {error && <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>{error}</div>}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("customers.colName")}</th>
              <th>{t("customers.colContacts")}</th>
              <th>{t("customers.colTier")}</th>
              <th className="num">{t("customers.colOrders")}</th>
              <th className="num">{t("customers.colSpent")}</th>
              <th>{t("customers.colLast")}</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} onClick={() => setForm(toForm(c))}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {c.phone && <div className="mono">{c.phone}</div>}
                  {c.email && <div>{c.email}</div>}
                </td>
                <td>
                  <span className={`tier tier-${c.tier}`}>
                    <Icon name="check" size={10} /> {t(`tiers.${c.tier}`)}
                  </span>
                </td>
                <td className="num">{c.orders_count}</td>
                <td className="num">{formatMoney(c.total_spent, activeShop.currency)}</td>
                <td style={{ fontSize: 12, color: "var(--text-3)" }}>{formatRelative(c.last_order_at)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn ghost icon" onClick={() => handleDelete(c.id)} title={t("common.delete")}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("customers.empty")}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("common.loading")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && slug && (
        <CustomerDrawer
          shopSlug={slug}
          form={form}
          onClose={() => setForm(null)}
          onSaved={async () => {
            setForm(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function toForm(c: Customer): FormState {
  return { id: c.id, name: c.name, email: c.email, phone: c.phone, tier: c.tier, note: c.note };
}

function CustomerDrawer({
  shopSlug,
  form,
  onClose,
  onSaved,
}: {
  shopSlug: string;
  form: FormState;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(form);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const isEdit = form.id !== undefined;

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrs({});
    try {
      const payload: CustomerInput = {
        name: state.name,
        email: state.email || undefined,
        phone: state.phone || undefined,
        tier: state.tier,
        note: state.note || undefined,
      };
      if (isEdit && state.id !== undefined) {
        await customersApi.updateCustomer(shopSlug, state.id, payload);
      } else {
        await customersApi.createCustomer(shopSlug, payload);
      }
      await onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = (err.body ?? {}) as Record<string, string[]>;
        const e2: Record<string, string> = {};
        for (const [k, v] of Object.entries(body)) if (Array.isArray(v)) e2[k] = v[0];
        setErrs(e2);
      } else {
        setErrs({ _: t("orders.saveError") });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <h2 className="serif" style={{ margin: 0, fontSize: 24, fontStyle: "italic" }}>
            {isEdit ? t("customers.editCustomer") : t("customers.newCustomer")}
          </h2>
          <button className="btn ghost icon" onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>
        </header>
        <form onSubmit={handleSubmit} className="drawer-body">
          <Field label={t("customers.name")} error={errs.name}>
            <input value={state.name} required onChange={(e) => patch("name", e.target.value)} style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={t("customers.phone")} error={errs.phone}>
              <input value={state.phone ?? ""} onChange={(e) => patch("phone", e.target.value)} style={inputStyle} />
            </Field>
            <Field label={t("customers.email")} error={errs.email}>
              <input type="email" value={state.email ?? ""} onChange={(e) => patch("email", e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <Field label={t("customers.tier")}>
            <select value={state.tier ?? "bronze"} onChange={(e) => patch("tier", e.target.value as CustomerTier)} style={inputStyle}>
              {TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {t(`tiers.${tier}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("customers.note")}>
            <textarea value={state.note ?? ""} rows={3} onChange={(e) => patch("note", e.target.value)} style={inputStyle} />
          </Field>
          {errs._ && <div style={{ color: "var(--err)", fontSize: 12 }}>{errs._}</div>}
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
