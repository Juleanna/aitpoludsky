import { useTranslation } from "react-i18next";

import { Icon } from "@/components/Icon";

type Props = {
  titleKey: string;
  descKey: string;
  iconName: string;
};

// Універсальний placeholder для ще не реалізованих розділів.
// Використовується для пунктів меню, винесених з прототипу (Аналітика, Календар,
// Сад товарів, Доставка, Локації, Оплати, POS каса), поки для них немає окремих сторінок.
export function ComingSoonPage({ titleKey, descKey, iconName }: Props) {
  const { t } = useTranslation();

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t(titleKey)}</h1>
          <p className="page-sub">{t(descKey)}</p>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: "64px 32px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "var(--accent-soft)",
            color: "var(--accent-ink)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name={iconName} size={30} />
        </div>
        <h2 className="serif" style={{ margin: 0, fontSize: 28, fontStyle: "italic" }}>
          {t("comingSoon.title")}
        </h2>
        <p style={{ margin: 0, color: "var(--text-2)", maxWidth: 420 }}>
          {t("comingSoon.description")}
        </p>
      </div>
    </div>
  );
}
