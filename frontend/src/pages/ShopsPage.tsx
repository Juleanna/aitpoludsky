import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";
import * as shopsApi from "@/api/shops";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { Currency } from "@/types";

const ALL_LANGUAGES = ["uk", "en", "pl", "de", "fr", "es", "it", "ru"] as const;

export function ShopsPage() {
  const { t } = useTranslation();
  const { shops, refresh, setActiveSlug } = useShops();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t("shops.title")}</h1>
          <p className="page-sub">{t("shops.subtitle")}</p>
        </div>
        <button className="btn accent" onClick={() => setShowForm((v) => !v)}>
          <Icon name="plus" size={14} /> {showForm ? t("common.cancel") : t("shops.newShop")}
        </button>
      </div>

      {showForm && (
        <CreateShopForm
          onDone={async (slug) => {
            await refresh();
            setActiveSlug(slug);
            setShowForm(false);
          }}
        />
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("shops.colName")}</th>
              <th>{t("shops.colSlug")}</th>
              <th>{t("shops.colCurrency")}</th>
              <th>{t("shops.colLanguages")}</th>
              <th>{t("shops.colRole")}</th>
              <th>{t("shops.colDate")}</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((s) => (
              <tr key={s.id} onClick={() => setActiveSlug(s.slug)}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td className="mono">{s.slug}</td>
                <td>{s.currency}</td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {[s.default_language, ...(s.languages || []).filter((l) => l !== s.default_language)]
                    .map((l) => l.toUpperCase())
                    .join(", ")}
                </td>
                <td>
                  <span className="chip">{s.role ?? t("common.none")}</span>
                </td>
                <td style={{ color: "var(--text-3)", fontSize: 12 }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {shops.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                  {t("shops.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateShopForm({ onDone }: { onDone: (slug: string) => void | Promise<void> }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [currency, setCurrency] = useState<Currency>("UAH");
  const [defaultLanguage, setDefaultLanguage] = useState("uk");
  const [extraLanguages, setExtraLanguages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleLang(code: string) {
    if (code === defaultLanguage) return; // default isn't in "extras"
    setExtraLanguages((prev) => (prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await shopsApi.createShop({
        name,
        slug,
        currency,
        default_language: defaultLanguage,
        languages: extraLanguages,
      });
      await onDone(created.slug);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = err.body as Record<string, string[]> | null;
        setError((body && Object.values(body)[0]?.[0]) ?? t("auth.checkFields"));
      } else {
        setError(t("shops.saveError"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ padding: 18, marginTop: 16, display: "grid", gap: 14 }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 12 }}>
        <input placeholder={t("shops.formName")} value={name} required onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input
          placeholder={t("shops.formSlug")}
          value={slug}
          required
          pattern="[a-z0-9-]+"
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          style={inputStyle}
        />
        <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} style={inputStyle}>
          <option value="UAH">₴ UAH</option>
          <option value="USD">$ USD</option>
          <option value="EUR">€ EUR</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 6 }}>
            {t("shops.defaultLanguage").toUpperCase()}
          </div>
          <select
            value={defaultLanguage}
            onChange={(e) => {
              const next = e.target.value;
              setDefaultLanguage(next);
              setExtraLanguages((prev) => prev.filter((l) => l !== next));
            }}
            style={inputStyle}
          >
            {ALL_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {t(`languages.${code}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 6 }}>
            {t("shops.extraLanguages").toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ALL_LANGUAGES.filter((l) => l !== defaultLanguage).map((code) => {
              const on = extraLanguages.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  className={on ? "btn accent" : "btn"}
                  style={{ fontSize: 12, padding: "4px 10px" }}
                  onClick={() => toggleLang(code)}
                >
                  {t(`languages.${code}`)}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{t("shops.extraLanguagesHint")}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {error && <div style={{ color: "var(--err)", fontSize: 12, flex: 1 }}>{error}</div>}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? t("common.creating") : t("common.create")}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-sm)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13,
  width: "100%",
};
