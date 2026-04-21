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

// Канали публікації — поки UI-only (немає бекенд-поля).
// У майбутньому можна додати поле у Product і серіалізовувати.
type ChannelKey = "web" | "ig" | "google" | "pos";
const CHANNELS: { key: ChannelKey; emoji: string }[] = [
  { key: "web", emoji: "🌐" },
  { key: "ig", emoji: "📸" },
  { key: "google", emoji: "🔍" },
  { key: "pos", emoji: "💳" },
];

// Тон thumbnail за індексом у списку, щоб візуально відрізняти товари.
const toneFor = (index: number): string => String(((index % 8) + 1));

export function CatalogPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Активні канали публікації для поточного товару в редакторі (UI-only).
  const [channels, setChannels] = useState<Set<ChannelKey>>(new Set(["web", "ig", "pos"]));

  const slug = activeShop?.slug ?? null;

  // Глобальна подія ait:new-product (від хоткея N→P) — відкриває drawer нового товару.
  useEffect(() => {
    const handler = () => setForm(emptyForm());
    window.addEventListener("ait:new-product", handler);
    return () => window.removeEventListener("ait:new-product", handler);
  }, []);

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const list = await catalogApi.listProducts(slug);
      setProducts(list);
      // Обираємо перший товар для живого редактора, якщо нічого не вибрано.
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
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
    if (selectedId === id) setSelectedId(null);
    await reload();
  }

  // Inline PATCH — оновлюємо локальний стан одразу (оптимістично),
  // потім відправляємо PATCH. На помилку — відкат + alert.
  async function patchProduct(id: number, patch: Partial<ProductInput>) {
    if (!slug) return;
    const prev = products.find((p) => p.id === id);
    if (!prev) return;
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, ...patch } as Product : p)));
    try {
      const updated = await catalogApi.updateProduct(slug, id, patch);
      setProducts((list) => list.map((p) => (p.id === id ? updated : p)));
    } catch {
      setProducts((list) => list.map((p) => (p.id === id ? prev : p)));
      window.alert(t("catalog.saveError"));
    }
  }

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

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
          <p className="page-sub">{t("catalog.subtitlePrototype")}</p>
        </div>
        <button className="btn primary" onClick={() => setForm(emptyForm())}>
          <Icon name="plus" size={14} /> {t("catalog.newProduct")}
        </button>
      </div>

      {error && (
        <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>
          {error}
        </div>
      )}

      {/* Таблиця товарів з drag-handle, thumbnail і inline-edit */}
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>{t("catalog.colProduct")}</th>
              <th className="num">{t("catalog.colPriceHint")}</th>
              <th className="num">{t("catalog.colStockHint")}</th>
              <th>{t("catalog.colStatus")}</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr
                key={p.id}
                draggable
                onClick={() => setSelectedId(p.id)}
                style={{
                  background: p.id === selectedId ? "var(--bg-sunken)" : undefined,
                }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <Icon name="drag" size={14} className="drag-handle" />
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="product-thumb-sm" data-tone={toneFor(idx)} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                        {p.sku}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="num" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="inline-edit num mono"
                    defaultValue={p.price}
                    type="number"
                    step="0.01"
                    min="0"
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== p.price) void patchProduct(p.id, { price: v });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />
                </td>
                <td className="num" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="inline-edit num mono"
                    defaultValue={p.stock}
                    type="number"
                    min="0"
                    style={{ color: p.stock < 5 ? "var(--err)" : undefined }}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v) && v !== p.stock) void patchProduct(p.id, { stock: v });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />
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
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("catalog.empty")}
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

      {/* Редактор товару з живим preview */}
      {selected && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-head">
            <h3 className="card-title">{t("catalog.editorTitle")}</h3>
          </div>
          <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 220px", gap: 28 }}>
            <div>
              <label className="onb-label">{t("catalog.name")}</label>
              <input
                className="onb-input"
                key={`name-${selected.id}`}
                defaultValue={selected.name}
                onBlur={(e) => {
                  if (e.target.value !== selected.name) void patchProduct(selected.id, { name: e.target.value });
                }}
              />
              <label className="onb-label" style={{ marginTop: 14 }}>
                {t("catalog.description")}
              </label>
              <textarea
                className="onb-input"
                key={`desc-${selected.id}`}
                rows={3}
                defaultValue={selected.description}
                onBlur={(e) => {
                  if (e.target.value !== selected.description)
                    void patchProduct(selected.id, { description: e.target.value });
                }}
              />

              <div className="publish-channels">
                {CHANNELS.map((c) => {
                  const on = channels.has(c.key);
                  return (
                    <div
                      key={c.key}
                      className={`pub-channel ${on ? "active" : ""}`}
                      onClick={() =>
                        setChannels((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.key)) next.delete(c.key);
                          else next.add(c.key);
                          return next;
                        })
                      }
                    >
                      {on && (
                        <span className="check">
                          <Icon name="check" size={12} />
                        </span>
                      )}
                      <div className="pub-channel-emoji">{c.emoji}</div>
                      <div className="pub-channel-label">{t(`catalog.channels.${c.key}`)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live preview картки товару */}
            <div>
              <div
                className="mono"
                style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 6, letterSpacing: "0.08em" }}
              >
                {t("catalog.previewLabel")}
              </div>
              <div className="inline-preview">
                <div
                  className="product-thumb"
                  data-tone={toneFor(products.findIndex((p) => p.id === selected.id))}
                />
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {t("catalog.previewCategory").toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{selected.name}</div>
                  <div className="serif" style={{ fontSize: 18, marginTop: 4 }}>
                    {formatMoney(selected.price, activeShop.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

type DrawerProps = {
  shopSlug: string;
  form: FormState;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

// Drawer лишається тільки для створення нового товару.
// Редагування вже існуючих — inline у таблиці / у живому редакторі.
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
        if (lang === defaultLang) continue;
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
            {t("catalog.newProduct")}
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
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>
                  {t("catalog.translationsHint")}
                </div>
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
