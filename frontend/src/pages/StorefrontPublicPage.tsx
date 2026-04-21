import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as storefrontApi from "@/api/storefront";
import type { PublicProduct, PublicShop } from "@/api/storefront";
import { formatMoney } from "@/utils/format";

function localizeProduct(product: PublicProduct, lang: string, fallbackLang: string) {
  if (lang !== fallbackLang) {
    const t = product.translations?.[lang];
    if (t?.name || t?.description) {
      return {
        name: t.name || product.name,
        description: t.description || product.description,
      };
    }
  }
  return { name: product.name, description: product.description };
}

export function StorefrontPublicPage() {
  const { t } = useTranslation();
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const [shop, setShop] = useState<PublicShop | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [lang, setLang] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shopSlug) return;
    try {
      const [s, p] = await Promise.all([
        storefrontApi.getPublicShop(shopSlug),
        storefrontApi.listPublicProducts(shopSlug),
      ]);
      setShop(s);
      setProducts(p);
      setLang((prev) => prev ?? s.default_language);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setError(t("common.error"));
      else setError(t("common.error"));
    }
  }, [shopSlug, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableLangs = useMemo(() => {
    if (!shop) return [];
    return [shop.default_language, ...(shop.languages || []).filter((l) => l !== shop.default_language)];
  }, [shop]);

  if (error) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: "var(--text-3)" }}>
        {error}
      </div>
    );
  }

  if (!shop || lang === null) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: "var(--text-3)" }}>
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 className="serif" style={{ fontSize: 44, margin: 0, fontStyle: "italic" }}>
            {shop.name}
          </h1>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, letterSpacing: "0.1em" }}>
            {shop.slug}.{"{domain}"}
          </div>
        </div>
        {availableLangs.length > 1 && (
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label={t("topbar.language")}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-sm)",
              background: "var(--bg-elev)",
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          >
            {availableLangs.map((l) => (
              <option key={l} value={l}>
                {t(`languages.${l}`)}
              </option>
            ))}
          </select>
        )}
      </header>

      {products.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
          {t("storefront.noProducts")}
        </div>
      ) : (
        <div className="grid g-3">
          {products.map((p) => {
            const loc = localizeProduct(p, lang, shop.default_language);
            return (
              <article key={p.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {p.sku}
                </div>
                <h3 className="serif" style={{ fontSize: 22, margin: 0, fontStyle: "italic" }}>
                  {loc.name}
                </h3>
                {loc.description && (
                  <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>{loc.description}</p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: 14,
                    borderTop: "1px dashed var(--line)",
                  }}
                >
                  <span className="serif" style={{ fontSize: 24 }}>
                    {formatMoney(p.price, shop.currency)}
                  </span>
                  <button className="btn accent" type="button">
                    {t("storefront.addToCart")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
