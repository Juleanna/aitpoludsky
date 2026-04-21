import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as catalogApi from "@/api/catalog";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Category } from "@/types";

// Сторінка керування категоріями товарів у межах одного магазину.
// Простий inline-CRUD: зверху форма «Додати категорію», нижче список
// з inline-редагуванням назви, перестановкою позиції (↑/↓) і видаленням.

export function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeShop } = useShops();

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Нова категорія — окремий draft, щоб не перемикати режим форми.
  const [newName, setNewName] = useState("");
  // Режим редагування конкретного рядка — тримаємо id і чорновик назви.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const slug = activeShop?.slug ?? null;

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await catalogApi.listCategories(slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [slug, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function pickError(err: unknown): string {
    if (err instanceof ApiError && err.body && typeof err.body === "object") {
      const body = err.body as Record<string, string[] | string>;
      const first = Object.values(body)[0];
      if (first) return Array.isArray(first) ? first[0] : String(first);
    }
    return t("common.error");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!slug) return;
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      await catalogApi.createCategory(slug, { name, position: items.length });
      setNewName("");
      await reload();
    } catch (err) {
      setError(pickError(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: number) {
    if (!slug) return;
    const name = editDraft.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    const current = items.find((c) => c.id === id);
    if (current && current.name === name) {
      setEditingId(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await catalogApi.updateCategory(slug, id, { name });
      setEditingId(null);
      await reload();
    } catch (err) {
      setError(pickError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number) {
    if (!slug) return;
    if (!confirm(t("categories.deleteConfirm"))) return;
    setBusy(true);
    setError(null);
    try {
      await catalogApi.deleteCategory(slug, id);
      await reload();
    } catch (err) {
      setError(pickError(err));
    } finally {
      setBusy(false);
    }
  }

  // Перестановка: міняємо position місцями з сусідом і сохраняємо.
  async function move(id: number, direction: -1 | 1) {
    if (!slug) return;
    const index = items.findIndex((c) => c.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    setBusy(true);
    setError(null);
    try {
      await Promise.all([
        catalogApi.updateCategory(slug, a.id, { position: b.position }),
        catalogApi.updateCategory(slug, b.id, { position: a.position }),
      ]);
      await reload();
    } catch (err) {
      setError(pickError(err));
    } finally {
      setBusy(false);
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
    <div className="content" style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button
          type="button"
          className="btn ghost icon"
          onClick={() => navigate("/catalog")}
          aria-label={t("common.back")}
        >
          <Icon name="arrow_left" size={14} />
        </button>
        <Link to="/catalog" style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none" }}>
          {t("nav.catalog")}
        </Link>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--text)" }}>{t("categories.title")}</span>
      </div>

      <div className="page-head" style={{ paddingBottom: 20 }}>
        <div>
          <h1 className="page-title">{t("categories.title")}</h1>
          <p className="page-sub">
            {t("categories.subtitle", { shop: activeShop.name, count: items.length })}
          </p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="onb-input"
            value={newName}
            placeholder={t("categories.namePlaceholder")}
            onChange={(e) => setNewName(e.target.value)}
            disabled={busy}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn accent" disabled={busy || !newName.trim()}>
            <Icon name="plus" size={12} /> {t("categories.add")}
          </button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)" }}>
            {t("common.loading")}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)" }}>
            {t("categories.empty")}
          </div>
        ) : (
          <table className="tbl" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>{t("categories.colName")}</th>
                <th style={{ width: 200, textAlign: "right" }}>{t("categories.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, i) => {
                const isEditing = editingId === c.id;
                return (
                  <tr key={c.id}>
                    <td className="mono" style={{ color: "var(--text-3)" }}>
                      {i + 1}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="inline-edit"
                          value={editDraft}
                          autoFocus
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void saveEdit(c.id);
                            } else if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          onBlur={() => void saveEdit(c.id)}
                        />
                      ) : (
                        <button
                          type="button"
                          className="btn ghost"
                          style={{ padding: "2px 6px" }}
                          onClick={() => {
                            setEditingId(c.id);
                            setEditDraft(c.name);
                          }}
                        >
                          {c.name}
                        </button>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 4 }}>
                        <button
                          type="button"
                          className="btn ghost icon"
                          onClick={() => void move(c.id, -1)}
                          disabled={busy || i === 0}
                          aria-label={t("categories.moveUp")}
                          title={t("categories.moveUp")}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn ghost icon"
                          onClick={() => void move(c.id, 1)}
                          disabled={busy || i === items.length - 1}
                          aria-label={t("categories.moveDown")}
                          title={t("categories.moveDown")}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn ghost icon"
                          onClick={() => void handleDelete(c.id)}
                          disabled={busy}
                          aria-label={t("common.delete")}
                          title={t("common.delete")}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
