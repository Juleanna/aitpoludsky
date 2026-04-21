import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import * as dashboardApi from "@/api/dashboard";
import * as inboxApi from "@/api/inbox";
import { UI_LANGUAGES } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { useShops } from "@/context/ShopContext";
import { Brand } from "./Brand";
import { Icon } from "./Icon";

// Схема меню: секції з заголовками + пункти з іконками та опційними лічильниками.
type NavItem = {
  to: string;
  labelKey: string;
  icon: string;
  // Ключ з обʼєкта counts, якщо пункту треба показати бейдж
  countKey?: "orders" | "catalog" | "inbox" | "locations";
};

type NavSection = {
  labelKey: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    labelKey: "sidebar.section.overview",
    items: [
      { to: "/dashboard", labelKey: "nav.dashboard", icon: "home" },
      { to: "/analytics", labelKey: "nav.analytics", icon: "chart" },
      { to: "/calendar", labelKey: "nav.calendar", icon: "calendar" },
    ],
  },
  {
    labelKey: "sidebar.section.sales",
    items: [
      { to: "/orders", labelKey: "nav.orders", icon: "cart", countKey: "orders" },
      { to: "/catalog", labelKey: "nav.catalog", icon: "box", countKey: "catalog" },
      { to: "/customers", labelKey: "nav.customers", icon: "users" },
      { to: "/discounts", labelKey: "nav.discounts", icon: "tag" },
      { to: "/garden", labelKey: "nav.garden", icon: "leaf" },
    ],
  },
  {
    labelKey: "sidebar.section.operations",
    items: [
      { to: "/shipping", labelKey: "nav.shipping", icon: "truck" },
      { to: "/locations", labelKey: "nav.locations", icon: "store", countKey: "locations" },
      { to: "/payments", labelKey: "nav.payments", icon: "credit" },
      { to: "/inventory", labelKey: "nav.inventory", icon: "package" },
    ],
  },
  {
    labelKey: "sidebar.section.channels",
    items: [
      { to: "/storefront", labelKey: "nav.storefront", icon: "globe" },
      { to: "/pos", labelKey: "nav.pos", icon: "grid" },
      { to: "/inbox", labelKey: "nav.inbox", icon: "chat", countKey: "inbox" },
    ],
  },
];

// Мапінг шляхів → ключів заголовків у топбарі
const TITLE_KEYS: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/analytics": "nav.analytics",
  "/calendar": "nav.calendar",
  "/orders": "nav.orders",
  "/catalog": "nav.catalog",
  "/customers": "nav.customers",
  "/discounts": "nav.discounts",
  "/garden": "nav.garden",
  "/shipping": "nav.shipping",
  "/locations": "nav.locations",
  "/payments": "nav.payments",
  "/inventory": "nav.inventory",
  "/storefront": "nav.storefront",
  "/pos": "nav.pos",
  "/inbox": "nav.inbox",
  "/shops": "nav.shops",
};

type SidebarCounts = {
  orders: number;
  catalog: number;
  inbox: number;
  locations: number;
};

// HEALTH-порогові значення — моковий обчислювач показника готовності магазину.
// Поки враховує лише наявність активного магазину + кілька ключових дій (товари, замовлення).
function computeHealth(counts: SidebarCounts, hasShop: boolean): number {
  if (!hasShop) return 0;
  let score = 40; // магазин створено
  if (counts.catalog > 0) score += 20;
  if (counts.orders > 0) score += 20;
  if (counts.catalog >= 5) score += 10;
  if (counts.orders >= 3) score += 10;
  return Math.min(score, 100);
}

export function Shell() {
  const { t } = useTranslation();
  const { user, logout, setLanguage } = useAuth();
  const { activeShop, shops, setActiveSlug } = useShops();
  const location = useLocation();
  const titleKey = TITLE_KEYS[location.pathname] ?? "";

  const [counts, setCounts] = useState<SidebarCounts>({ orders: 0, catalog: 0, inbox: 0, locations: 0 });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Згорнутий sidebar — читаємо/пишемо в localStorage, щоб зберігати стан
  // між перезавантаженнями сторінки.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem("ait_sidebar_collapsed") === "1",
  );
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => {
      const next = !v;
      localStorage.setItem("ait_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }, []);

  // Лічильники для бейджів у сайдбарі — зі зведеного дашборд-ендпоінту
  // плюс окремий запит на inbox (непрочитані треди).
  const slug = activeShop?.slug ?? null;
  const refreshCounts = useCallback(async () => {
    if (!slug) {
      setCounts({ orders: 0, catalog: 0, inbox: 0, locations: 0 });
      return;
    }
    try {
      const [summary, threads] = await Promise.all([
        dashboardApi.fetchSummary(slug),
        inboxApi.listThreads(slug),
      ]);
      setCounts({
        orders: summary.orders.all.count,
        catalog: summary.products.total,
        inbox: threads.filter((th) => th.unread).length,
        locations: 0,
      });
    } catch {
      // Нехай сайдбар працює мовчки навіть якщо запит впав — просто без бейджів.
    }
  }, [slug]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts, location.pathname]);

  const health = useMemo(() => computeHealth(counts, !!activeShop), [counts, activeShop]);

  const userInitial = (user?.full_name || user?.email || "?")[0].toUpperCase();
  const userName = user?.full_name || user?.email?.split("@")[0] || "";
  const shopHandle = activeShop ? `${activeShop.slug}.shop` : "";

  return (
    <div className="app" data-sidebar={sidebarCollapsed ? "compact" : "expanded"}>
      <aside className="side">
        {/* Заголовок: логотип + HEALTH-бейдж */}
        <div className="side-head">
          <div className="brand-mark">a</div>
          <div>
            <Brand size="md" />
            <div className="brand-tag" style={{ marginTop: 2 }}>
              {t("sidebar.health")} <strong style={{ color: "var(--text-2)", fontWeight: 500 }}>{health}/100</strong>
            </div>
          </div>
        </div>

        {/* Селектор активного магазину — показуємо якщо магазинів >1 */}
        {shops.length > 1 && (
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
            <select
              value={activeShop?.slug ?? ""}
              onChange={(e) => setActiveSlug(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "var(--bg-elev)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-sm)",
                color: "var(--text)",
                fontSize: 12,
              }}
            >
              {shops.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Навігація з секціями */}
        <nav className="side-nav">
          {SECTIONS.map((section) => (
            <div key={section.labelKey}>
              <div className="side-section-label">{t(section.labelKey)}</div>
              {section.items.map((item) => {
                const count = item.countKey ? counts[item.countKey] : 0;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) => "side-item" + (isActive ? " active" : "")}
                  >
                    <Icon name={item.icon} />
                    <span className="side-label">{t(item.labelKey)}</span>
                    {item.countKey && count > 0 && <span className="side-count">{count}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Футер: інформація про користувача + меню "..." */}
        <div className="side-foot">
          <div className="side-user" style={{ position: "relative" }}>
            <div className="avatar">{userInitial}</div>
            <div className="side-user-info">
              <div className="side-user-name">{userName}</div>
              <div className="side-user-email">{shopHandle || user?.email}</div>
            </div>
            <button
              className="btn ghost icon"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-label={t("sidebar.userMenu")}
              title={t("sidebar.userMenu")}
            >
              <Icon name="more" size={16} />
            </button>
            {userMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 6px)",
                  right: 6,
                  background: "var(--bg-elev)",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "var(--r-md)",
                  boxShadow: "var(--shadow-lg)",
                  minWidth: 200,
                  padding: 6,
                  zIndex: 50,
                }}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <NavLink
                  to="/shops"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    fontSize: 13,
                    color: "var(--text)",
                    textDecoration: "none",
                  }}
                >
                  <Icon name="settings" size={14} /> {t("nav.shops")}
                </NavLink>
                <LanguagePicker
                  value={user?.language ?? "uk"}
                  onChange={(code) => void setLanguage(code)}
                  label={t("topbar.language")}
                />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    void logout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    fontSize: 13,
                    color: "var(--err)",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <Icon name="logout" size={14} /> {t("auth.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          {/* Гамбургер — згорнути/розгорнути сайдбар */}
          <button
            className="topbar-icon-btn"
            onClick={toggleSidebar}
            aria-label={t("topbar.toggleSidebar")}
            title={t("topbar.toggleSidebar")}
          >
            <Icon name="menu" size={18} />
          </button>

          {/* Крихти: Назва магазину / Поточний розділ */}
          <div className="crumbs">
            <span>{activeShop?.name ?? t("app.name")}</span>
            <span className="sep">/</span>
            <span className="current">{titleKey ? t(titleKey) : ""}</span>
          </div>

          <div className="topbar-actions">
            <div className="search" role="button" tabIndex={0}>
              <Icon name="search" size={14} />
              <span>{t("topbar.searchPlaceholder")}</span>
              <span className="kbd">⌘K</span>
            </div>

            {/* Клавіатурні скорочення — поки placeholder */}
            <button
              className="topbar-icon-btn"
              aria-label={t("topbar.shortcuts")}
              title={t("topbar.shortcuts")}
            >
              <Icon name="keyboard" size={16} />
            </button>

            {/* Сповіщення — число непрочитаних з Inbox */}
            <button
              className="topbar-icon-btn"
              aria-label={t("topbar.notifications")}
              title={t("topbar.notifications")}
              style={{ position: "relative" }}
            >
              <Icon name="bell" size={16} />
              {counts.inbox > 0 && <span className="topbar-badge">{counts.inbox}</span>}
            </button>

            {/* Користувач — аватар + імʼя */}
            <div className="topbar-user" title={user?.email}>
              <div className="avatar">{userInitial}</div>
              <span className="topbar-user-name">{userName}</span>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );

}

// Вибір мови UI усередині користувацького меню футера.
function LanguagePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  label: string;
}) {
  return (
    <div style={{ padding: "6px 10px" }}>
      <div
        className="mono"
        style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 4 }}
      >
        {label.toUpperCase()}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "4px 8px",
          fontSize: 12,
          background: "var(--bg)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-sm)",
          color: "var(--text)",
        }}
      >
        {UI_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
