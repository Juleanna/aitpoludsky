import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import * as catalogApi from "@/api/catalog";
import { useConfirm } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Product, ProductInput } from "@/types";

// Тон thumbnail за індексом у списку, щоб візуально відрізняти товари,
// коли у товара ще немає завантажених зображень.
const toneFor = (index: number): string => String(((index % 8) + 1));

export function CatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeShop } = useShops();
  const ask = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      title: t("catalog.deleteConfirm"),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!ok) return;
    await catalogApi.deleteProduct(slug, id);
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
            {products.map((p, idx) => {
              const primaryImage = p.images?.find((i) => i.is_primary) ?? p.images?.[0];
              return (
              <tr
                key={p.id}
                draggable
                onClick={() => navigate(`/catalog/${p.id}/edit`)}
                style={{ cursor: "pointer" }}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <Icon name="drag" size={14} className="drag-handle" />
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {primaryImage ? (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "var(--r-sm)",
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "var(--bg-sunken)",
                        }}
                      >
                        <img
                          src={primaryImage.image}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </div>
                    ) : (
                      <div className="product-thumb-sm" data-tone={toneFor(idx)} />
                    )}
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
              );
            })}
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
    </div>
  );
}

