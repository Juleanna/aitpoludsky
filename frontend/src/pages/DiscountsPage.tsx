import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as discountsApi from "@/api/discounts";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Discount, DiscountInput, DiscountKind } from "@/types";

type FormState = DiscountInput & { id?: number };

function emptyForm(): FormState {
  return {
    code: "",
    name: "",
    kind: "percent",
    value: "10",
    min_subtotal: "0",
    starts_at: null,
    ends_at: null,
    max_uses: null,
    is_active: true,
  };
}

export function DiscountsPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const slug = activeShop?.slug ?? null;

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await discountsApi.listDiscounts(slug));
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
    if (!confirm(t("discounts.deleteConfirm"))) return;
    await discountsApi.deleteDiscount(slug, id);
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
          <h1 className="page-title">{t("discounts.title")}</h1>
          <p className="page-sub">{t("discounts.subtitle", { shop: activeShop.name, count: items.length })}</p>
        </div>
        <button className="btn accent" onClick={() => setForm(emptyForm())}>
          <Icon name="plus" size={14} /> {t("discounts.newDiscount")}
        </button>
      </div>

      {error && <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>{error}</div>}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("discounts.colCode")}</th>
              <th>{t("discounts.colKind")}</th>
              <th className="num">{t("discounts.colValue")}</th>
              <th className="num">{t("discounts.colMin")}</th>
              <th className="num">{t("discounts.colUses")}</th>
              <th>{t("discounts.colStatus")}</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} onClick={() => setForm(toForm(d))}>
                <td>
                  <div className="mono" style={{ fontWeight: 500 }}>{d.code}</div>
                  {d.name && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{d.name}</div>}
                </td>
                <td>
                  <span className="chip">{d.kind === "percent" ? "%" : t("discounts.kindFixed")}</span>
                </td>
                <td className="num">
                  {d.kind === "percent" ? `${Number(d.value)}%` : Number(d.value).toLocaleString("uk", { minimumFractionDigits: 2 })}
                </td>
                <td className="num">{Number(d.min_subtotal).toLocaleString("uk", { minimumFractionDigits: 2 })}</td>
                <td className="num">
                  {d.uses_count}
                  {d.max_uses != null && ` / ${d.max_uses}`}
                </td>
                <td>
                  {d.is_active ? (
                    <span className="chip ok"><span className="dot" />{t("catalog.statusActive")}</span>
                  ) : (
                    <span className="chip">{t("catalog.statusHidden")}</span>
                  )}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button className="btn ghost icon" onClick={() => handleDelete(d.id)} title={t("common.delete")}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("discounts.empty")}
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
        <DiscountDrawer
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

function toForm(d: Discount): FormState {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    kind: d.kind,
    value: d.value,
    min_subtotal: d.min_subtotal,
    starts_at: d.starts_at,
    ends_at: d.ends_at,
    max_uses: d.max_uses,
    is_active: d.is_active,
  };
}

function DiscountDrawer({
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
      const payload: DiscountInput = {
        code: state.code,
        name: state.name || undefined,
        kind: state.kind,
        value: state.value,
        min_subtotal: state.min_subtotal ?? "0",
        starts_at: state.starts_at || null,
        ends_at: state.ends_at || null,
        max_uses: state.max_uses ?? null,
        is_active: state.is_active,
      };
      if (isEdit && state.id !== undefined) {
        await discountsApi.updateDiscount(shopSlug, state.id, payload);
      } else {
        await discountsApi.createDiscount(shopSlug, payload);
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
            {isEdit ? t("discounts.editDiscount") : t("discounts.newDiscount")}
          </h2>
          <button className="btn ghost icon" onClick={onClose} aria-label={t("common.close")}>×</button>
        </header>
        <form onSubmit={handleSubmit} className="drawer-body">
          <Field label={t("discounts.code")} error={errs.code}>
            <input
              value={state.code}
              required
              onChange={(e) => patch("code", e.target.value.toUpperCase().replace(/\s+/g, ""))}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
            />
          </Field>
          <Field label={t("discounts.name")} error={errs.name}>
            <input value={state.name ?? ""} onChange={(e) => patch("name", e.target.value)} style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={t("discounts.kind")}>
              <select value={state.kind} onChange={(e) => patch("kind", e.target.value as DiscountKind)} style={inputStyle}>
                <option value="percent">%</option>
                <option value="fixed">{t("discounts.kindFixed")}</option>
              </select>
            </Field>
            <Field label={t("discounts.value")} error={errs.value}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={state.value}
                required
                onChange={(e) => patch("value", e.target.value)}
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              />
            </Field>
          </div>
          <Field label={t("discounts.minSubtotal")} error={errs.min_subtotal}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={state.min_subtotal ?? "0"}
              onChange={(e) => patch("min_subtotal", e.target.value)}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label={t("discounts.startsAt")}>
              <input
                type="datetime-local"
                value={state.starts_at ?? ""}
                onChange={(e) => patch("starts_at", e.target.value || null)}
                style={inputStyle}
              />
            </Field>
            <Field label={t("discounts.endsAt")}>
              <input
                type="datetime-local"
                value={state.ends_at ?? ""}
                onChange={(e) => patch("ends_at", e.target.value || null)}
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label={t("discounts.maxUses")}>
            <input
              type="number"
              min="1"
              value={state.max_uses ?? ""}
              onChange={(e) => patch("max_uses", e.target.value ? Number(e.target.value) : null)}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              placeholder={t("discounts.maxUsesHint")}
            />
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={state.is_active ?? true}
              onChange={(e) => patch("is_active", e.target.checked)}
            />
            {t("discounts.isActive")}
          </label>
          {errs._ && <div style={{ color: "var(--err)", fontSize: 12 }}>{errs._}</div>}
          <footer className="drawer-foot">
            <button type="button" className="btn" onClick={onClose}>{t("common.cancel")}</button>
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
