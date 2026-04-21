import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import * as catalogApi from "@/api/catalog";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Product, ProductInput } from "@/types";
import { formatMoney } from "@/utils/format";

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
  const navigate = useNavigate();
  const { activeShop } = useShops();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Активні канали публікації для поточного товару в редакторі (UI-only).
  const [channels, setChannels] = useState<Set<ChannelKey>>(new Set(["web", "ig", "pos"]));

  const slug = activeShop?.slug ?? null;

  // Глобальна подія ait:new-product (від хоткея N→P) — веде на сторінку створення.
  useEffect(() => {
    const handler = () => navigate("/catalog/new");
    window.addEventListener("ait:new-product", handler);
    return () => window.removeEventListener("ait:new-product", handler);
  }, [navigate]);

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
        <button className="btn primary" onClick={() => navigate("/catalog/new")}>
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

    </div>
  );
}

