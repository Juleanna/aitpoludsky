import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

// Рядок "швидкі екрани" під топбаром — компактні chip-посилання на часті розділи.
// Відображає підмножину меню: ключові сторінки + POS/Сад/Календар (заглушки).
const SCREENS: { to: string; labelKey: string }[] = [
  { to: "/onboarding", labelKey: "nav.onboarding" },
  { to: "/orders", labelKey: "nav.orders" },
  { to: "/catalog", labelKey: "nav.catalog" },
  { to: "/customers", labelKey: "nav.customers" },
  { to: "/discounts", labelKey: "nav.discounts" },
  { to: "/inbox", labelKey: "nav.inbox" },
  { to: "/storefront", labelKey: "nav.storefront" },
  { to: "/pos", labelKey: "nav.pos" },
  { to: "/garden", labelKey: "nav.garden" },
  { to: "/calendar", labelKey: "nav.calendar" },
];

export function QuickScreens() {
  const { t } = useTranslation();
  return (
    <div className="quick-screens">
      <span className="quick-screens-title">{t("topbar.quickScreens")} →</span>
      {SCREENS.map((s) => (
        <NavLink
          key={s.to}
          to={s.to}
          className={({ isActive }) => "quick-screen-link" + (isActive ? " active" : "")}
        >
          {t(s.labelKey)}
        </NavLink>
      ))}
    </div>
  );
}
