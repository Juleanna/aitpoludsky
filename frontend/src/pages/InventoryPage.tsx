import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as catalogApi from "@/api/catalog";
import * as inventoryApi from "@/api/inventory";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Product, StockMovement, StockMovementInput, StockMovementKind } from "@/types";
import { formatRelative } from "@/utils/format";

const KINDS: StockMovementKind[] = ["receipt", "issue", "adjustment", "writeoff"];

const KIND_CHIP: Record<StockMovementKind, string> = {
  receipt: "chip ok",
  issue: "chip",
  adjustment: "chip warn",
  writeoff: "chip err",
};

export function InventoryPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const slug = activeShop?.slug ?? null;

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      setMovements(await inventoryApi.listMovements(slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [slug, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

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
          <h1 className="page-title">{t("inventory.title")}</h1>
          <p className="page-sub">{t("inventory.subtitle")}</p>
        </div>
        <button className="btn accent" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={14} /> {t("inventory.newMovement")}
        </button>
      </div>

      {error && <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>{error}</div>}

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("inventory.colProduct")}</th>
              <th>{t("inventory.colKind")}</th>
              <th className="num">{t("inventory.colDelta")}</th>
              <th className="num">{t("inventory.colBalance")}</th>
              <th>{t("inventory.colNote")}</th>
              <th>{t("inventory.colWho")}</th>
              <th>{t("inventory.colWhen")}</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{m.product_name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                    {m.product_sku}
                  </div>
                </td>
                <td>
                  <span className={KIND_CHIP[m.kind]}>
                    <span className="dot" />
                    {t(`inventory.kinds.${m.kind}`)}
                  </span>
                </td>
                <td className="num" style={{ color: m.delta >= 0 ? "var(--ok)" : "var(--err)", fontWeight: 500 }}>
                  {m.delta >= 0 ? "+" : ""}
                  {m.delta}
                </td>
                <td className="num">{m.balance_after}</td>
                <td style={{ fontSize: 12, color: "var(--text-2)" }}>{m.note}</td>
                <td style={{ fontSize: 12, color: "var(--text-3)" }}>{m.created_by_email || t("common.none")}</td>
                <td style={{ fontSize: 12, color: "var(--text-3)" }}>{formatRelative(m.created_at)}</td>
              </tr>
            ))}
            {!loading && movements.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("inventory.empty")}
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

      {showForm && slug && (
        <MovementDrawer
          shopSlug={slug}
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function MovementDrawer({ shopSlug, onClose, onSaved }: { shopSlug: string; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [kind, setKind] = useState<StockMovementKind>("receipt");
  const [delta, setDelta] = useState<number>(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});

  useEffect(() => {
    void catalogApi.listProducts(shopSlug).then(setProducts).catch(() => setProducts([]));
  }, [shopSlug]);

  const selectedProduct = productId != null ? products.find((p) => p.id === productId) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrs({});
    if (productId == null) {
      setErrs({ product_id: t("inventory.mustSelectProduct") });
      return;
    }
    if (delta === 0) {
      setErrs({ delta: t("inventory.nonZero") });
      return;
    }

    const signedDelta = kind === "receipt" ? Math.abs(delta) : -Math.abs(delta);
    const payload: StockMovementInput = {
      product_id: productId,
      kind,
      delta: kind === "adjustment" ? delta : signedDelta,
      note: note || undefined,
    };

    setBusy(true);
    try {
      await inventoryApi.createMovement(shopSlug, payload);
      await onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = (err.body ?? {}) as Record<string, string[]>;
        const e2: Record<string, string> = {};
        for (const [k, v] of Object.entries(body)) if (Array.isArray(v)) e2[k] = v[0];
        setErrs(e2);
      } else {
        setErrs({ _: t("inventory.createError") });
      }
    } finally {
      setBusy(false);
    }
  }

  const signHint =
    kind === "receipt" ? t("inventory.hintAdd") : kind === "adjustment" ? t("inventory.hintSigned") : t("inventory.hintSub");

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <h2 className="serif" style={{ margin: 0, fontSize: 24, fontStyle: "italic" }}>
            {t("inventory.newMovementTitle")}
          </h2>
          <button className="btn ghost icon" onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>
        </header>
        <form onSubmit={handleSubmit} className="drawer-body">
          <Field label={t("inventory.product")} error={errs.product_id}>
            <select
              value={productId ?? ""}
              onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : null)}
              style={inputStyle}
            >
              <option value="">{t("inventory.selectProduct")}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) · {p.stock}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("inventory.kind")}>
            <select value={kind} onChange={(e) => setKind(e.target.value as StockMovementKind)} style={inputStyle}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`inventory.kinds.${k}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={kind === "adjustment" ? t("inventory.deltaSigned") : t("inventory.delta")} error={errs.delta}>
            <input
              type="number"
              required
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)" }}
            />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
              {signHint}
              {selectedProduct ? ` · ${t("inventory.hintCurrent", { n: selectedProduct.stock })}` : ""}
            </div>
          </Field>

          <Field label={t("inventory.note")}>
            <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
          </Field>

          {errs._ && <div style={{ color: "var(--err)", fontSize: 12 }}>{errs._}</div>}

          <footer className="drawer-foot">
            <button type="button" className="btn" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn accent" disabled={busy}>
              {busy ? t("common.creating") : t("common.create")}
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
