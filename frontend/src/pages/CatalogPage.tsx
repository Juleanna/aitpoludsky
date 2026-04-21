import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as catalogApi from "@/api/catalog";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Product, ProductInput, ProductTranslations } from "@/types";
import { formatMoney } from "@/utils/format";

type FormState = ProductInput & { id?: number };

function emptyForm(): FormState {
  return {
    sku: "",
    name: "",
    description: "",
    price: "0",
    stock: 0,
    is_active: true,
    translations: {},
  };
}

export function CatalogPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const slug = activeShop?.slug ?? null;

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      setProducts(await catalogApi.listProducts(slug));
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
    if (!confirm(t("catalog.deleteConfirm"))) return;
    await catalogApi.deleteProduct(slug, id);
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
          <h1 className="page-title">{t("catalog.title")}</h1>
          <p className="page-sub">{t("catalog.subtitle", { shop: activeShop.name, count: products.length })}</p>
        </div>
        <button className="btn accent" onClick={() => setForm(emptyForm())}>
          <Icon name="plus" size={14} /> {t("catalog.newProduct")}
        </button>
      </div>

      {error && (
        <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>
          {error}
        </div>
      )}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("catalog.colProduct")}</th>
              <th className="num">{t("catalog.colPrice")}</th>
              <th className="num">{t("catalog.colStock")}</th>
              <th>{t("catalog.colStatus")}</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} onClick={() => setForm(toForm(p))}>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {p.sku}
                  </div>
                </td>
                <td className="num">{formatMoney(p.price, activeShop.currency)}</td>
                <td className="num" style={{ color: p.stock < 5 ? "var(--err)" : undefined }}>
                  {p.stock}
                </td>
                <td>
                  {p.is_active ? (
                    <span className="chip ok">
                      <span className="dot" />
                      {t("catalog.statusActive")}
                    </span>
                  ) : (
                    <span className="chip">{t("catalog.statusHidden")}</span>
                  )}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn ghost icon"
                    onClick={() => handleDelete(p.id)}
                    title={t("common.delete")}
                    aria-label={t("common.delete")}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("catalog.empty")}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("common.loading")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && slug && (
        <ProductDrawer
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

function toForm(p: Product): FormState {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    is_active: p.is_active,
    translations: p.translations ?? {},
  };
}

type DrawerProps = {
  shopSlug: string;
  form: FormState;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

function ProductDrawer({ shopSlug, form, onClose, onSaved }: DrawerProps) {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const [state, setState] = useState<FormState>(form);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isEdit = form.id !== undefined;

  const defaultLang = activeShop?.default_language ?? "uk";
  const extraLangs = useMemo(
    () => (activeShop?.languages ?? []).filter((l) => l !== defaultLang),
    [activeShop, defaultLang],
  );
  const [activeTab, setActiveTab] = useState<string>(defaultLang);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }
  function patchTranslation(lang: string, field: "name" | "description", value: string) {
    setState((s) => {
      const next: ProductTranslations = { ...(s.translations ?? {}) };
      next[lang] = { ...(next[lang] ?? {}), [field]: value };
      return { ...s, translations: next };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFieldErrors({});
    try {
      const translations: ProductTranslations = {};
      for (const [lang, entry] of Object.entries(state.translations ?? {})) {
        if (lang === defaultLang) continue; // default lang lives in main name/description
        const cleaned: { name?: string; description?: string } = {};
        if (entry.name?.trim()) cleaned.name = entry.name;
        if (entry.description?.trim()) cleaned.description = entry.description;
        if (cleaned.name || cleaned.description) translations[lang] = cleaned;
      }
      const payload: ProductInput = {
        sku: state.sku,
        name: state.name,
        description: state.description ?? "",
        price: state.price,
        stock: Number(state.stock),
        is_active: state.is_active,
        translations,
      };
      if (isEdit && state.id !== undefined) {
        await catalogApi.updateProduct(shopSlug, state.id, payload);
      } else {
        await catalogApi.createProduct(shopSlug, payload);
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

  const langTabs = [defaultLang, ...extraLangs];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <h2 className="serif" style={{ margin: 0, fontSize: 24, fontStyle: "italic" }}>
            {isEdit ? t("catalog.editProduct") : t("catalog.newProduct")}
          </h2>
          <button className="btn ghost icon" onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>
        </header>
        <form onSubmit={handleSubmit} className="drawer-body">
          <FormField label={t("catalog.sku")} error={fieldErrors.sku}>
            <input
              value={state.sku}
              required
              onChange={(e) => patch("sku", e.target.value)}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
            />
          </FormField>

          <div>
            <div className="tab-bar" style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", marginBottom: 14 }}>
              {langTabs.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={activeTab === lang ? "active" : ""}
                  onClick={() => setActiveTab(lang)}
                  style={{
                    padding: "8px 14px",
                    borderBottom: `2px solid ${activeTab === lang ? "var(--accent)" : "transparent"}`,
                    color: activeTab === lang ? "var(--text)" : "var(--text-3)",
                    fontSize: 13,
                  }}
                >
                  {t(`languages.${lang}`)} {lang === defaultLang && "·"}
                </button>
              ))}
            </div>
            {activeTab === defaultLang ? (
              <>
                <FormField label={t("catalog.name")} error={fieldErrors.name}>
                  <input value={state.name} required onChange={(e) => patch("name", e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label={t("catalog.description")} error={fieldErrors.description}>
                  <textarea
                    value={state.description ?? ""}
                    rows={3}
                    onChange={(e) => patch("description", e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>{t("catalog.translationsHint")}</div>
                <FormField label={t("catalog.name")}>
                  <input
                    value={state.translations?.[activeTab]?.name ?? ""}
                    onChange={(e) => patchTranslation(activeTab, "name", e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label={t("catalog.description")}>
                  <textarea
                    value={state.translations?.[activeTab]?.description ?? ""}
                    rows={3}
                    onChange={(e) => patchTranslation(activeTab, "description", e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
              </>
            )}
            {extraLangs.length === 0 && (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{t("catalog.noExtraLanguages")}</div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label={t("catalog.price")} error={fieldErrors.price}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={state.price}
                required
                onChange={(e) => patch("price", e.target.value)}
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              />
            </FormField>
            <FormField label={t("catalog.stock")} error={fieldErrors.stock}>
              <input
                type="number"
                min="0"
                value={state.stock}
                required
                onChange={(e) => patch("stock", Number(e.target.value))}
                style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
              />
            </FormField>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={state.is_active ?? true}
              onChange={(e) => patch("is_active", e.target.checked)}
            />
            {t("catalog.isActive")}
          </label>
          {fieldErrors._ && <div style={{ color: "var(--err)", fontSize: 12 }}>{fieldErrors._}</div>}
          {fieldErrors.translations && <div style={{ color: "var(--err)", fontSize: 12 }}>{fieldErrors.translations}</div>}
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

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
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
