import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";

export function StorefrontAdminPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();

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

  const publicUrl = `/s/${activeShop.slug}`;

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t("storefront.title")}</h1>
          <p className="page-sub">{t("storefront.subtitle", { shop: activeShop.name })}</p>
        </div>
        <a href={publicUrl} target="_blank" rel="noreferrer" className="btn accent">
          <Icon name="arrow_right" size={14} /> {t("storefront.viewPublic")}
        </a>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 8 }}>
          PUBLIC URL
        </div>
        <div className="mono" style={{ fontSize: 16 }}>
          {window.location.origin}
          {publicUrl}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 16 }}>
          Публічна вітрина показує тільки активні товари з ненульовим залишком. Мова за замовчуванням —{" "}
          <strong>{t(`languages.${activeShop.default_language}`)}</strong>; клієнт може перемкнути на будь-яку з
          налаштованих ({activeShop.languages.length
            ? activeShop.languages.map((l) => t(`languages.${l}`)).join(", ")
            : "—"}
          ).
        </p>
      </div>
    </div>
  );
}
