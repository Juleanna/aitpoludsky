import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import * as catalogApi from "@/api/catalog";
import * as customersApi from "@/api/customers";
import * as ordersApi from "@/api/orders";
import { useShops } from "@/context/ShopContext";
import { useTweaks } from "@/context/TweaksContext";
import type { Customer, Order, Product } from "@/types";
import { currencySymbol } from "@/utils/format";
import { Icon } from "./Icon";

// Командна палітра — універсальний пошук + швидкі дії.
// Секції (в порядку показу):
//   navigation — перехід по сторінках
//   actions    — швидкі дії (новий товар, експорт тощо)
//   orders     — останні замовлення (із live-даних магазину)
//   products   — товари
//   customers  — клієнти
//   settings   — UI-налаштування (тема, компактний сайдбар)
//
// При відкритті підтягуємо до 5 замовлень / товарів / клієнтів активного
// магазину. При введенні запиту фільтруємо всі секції разом.

type SectionKey =
  | "navigation"
  | "actions"
  | "orders"
  | "products"
  | "customers"
  | "settings";

const SECTION_ORDER: SectionKey[] = [
  "navigation",
  "actions",
  "orders",
  "products",
  "customers",
  "settings",
];

const DATA_LIMIT = 5;

type Command = {
  id: string;
  section: SectionKey;
  icon: string;
  title: string;
  subtitle: string;
  /** Опційні бейджі-хоткеї справа */
  hotkey?: string[];
  run: () => void;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeShop } = useShops();
  const { tweaks, update } = useTweaks();

  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Lazy-load живі дані при відкритті (не блокує показ статичних команд).
  useEffect(() => {
    if (!open || !activeShop) return;
    const slug = activeShop.slug;
    void Promise.all([
      ordersApi.listOrders(slug).catch(() => [] as Order[]),
      catalogApi.listProducts(slug).catch(() => [] as Product[]),
      customersApi.listCustomers(slug).catch(() => [] as Customer[]),
    ]).then(([o, p, c]) => {
      setOrders(o.slice(0, DATA_LIMIT));
      setProducts(p.slice(0, DATA_LIMIT));
      setCustomers(c.slice(0, DATA_LIMIT));
    });
  }, [open, activeShop]);

  // Скидання при відкритті.
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      inputRef.current?.focus();
    }
  }, [open]);

  const currency = activeShop?.currency ?? "UAH";

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [];

    // ── Навігація ──────────────────────────────
    const nav: { id: string; icon: string; to: string; titleKey: string; subKey: string }[] = [
      { id: "dashboard", icon: "home", to: "/dashboard", titleKey: "nav.dashboard", subKey: "commandPalette.subtitles.dashboard" },
      { id: "orders-nav", icon: "cart", to: "/orders", titleKey: "nav.orders", subKey: "commandPalette.subtitles.orders" },
      { id: "catalog-nav", icon: "box", to: "/catalog", titleKey: "nav.catalog", subKey: "commandPalette.subtitles.catalog" },
      { id: "customers-nav", icon: "users", to: "/customers", titleKey: "nav.customers", subKey: "commandPalette.subtitles.customers" },
      { id: "analytics-nav", icon: "chart", to: "/analytics", titleKey: "nav.analytics", subKey: "commandPalette.subtitles.analytics" },
      { id: "inventory-nav", icon: "package", to: "/inventory", titleKey: "nav.inventory", subKey: "commandPalette.subtitles.inventory" },
      { id: "discounts-nav", icon: "tag", to: "/discounts", titleKey: "nav.discounts", subKey: "commandPalette.subtitles.discounts" },
      { id: "inbox-nav", icon: "chat", to: "/inbox", titleKey: "nav.inbox", subKey: "commandPalette.subtitles.inbox" },
      { id: "storefront-nav", icon: "globe", to: "/storefront", titleKey: "nav.storefront", subKey: "commandPalette.subtitles.storefront" },
      { id: "pos-nav", icon: "grid", to: "/pos", titleKey: "nav.pos", subKey: "commandPalette.subtitles.pos" },
      { id: "onboarding-nav", icon: "sparkle", to: "/onboarding", titleKey: "nav.onboarding", subKey: "commandPalette.subtitles.onboarding" },
    ];
    for (const n of nav) {
      list.push({
        id: `nav-${n.id}`,
        section: "navigation",
        icon: n.icon,
        title: t(n.titleKey),
        subtitle: t(n.subKey),
        run: () => navigate(n.to),
      });
    }

    // ── Дії ────────────────────────────────────
    list.push({
      id: "action-new-product",
      section: "actions",
      icon: "plus",
      title: t("commandPalette.actions.newProduct.title"),
      subtitle: t("commandPalette.actions.newProduct.subtitle"),
      hotkey: ["N", "P"],
      run: () => {
        navigate("/catalog");
        window.setTimeout(() => window.dispatchEvent(new CustomEvent("ait:new-product")), 120);
      },
    });
    list.push({
      id: "action-new-order",
      section: "actions",
      icon: "plus",
      title: t("commandPalette.actions.newOrder.title"),
      subtitle: t("commandPalette.actions.newOrder.subtitle"),
      hotkey: ["N", "O"],
      run: () => {
        navigate("/orders");
        window.setTimeout(() => window.dispatchEvent(new CustomEvent("ait:new-order")), 120);
      },
    });
    list.push({
      id: "action-export-orders",
      section: "actions",
      icon: "download",
      title: t("commandPalette.actions.exportOrders.title"),
      subtitle: t("commandPalette.actions.exportOrders.subtitle"),
      run: () => {
        // Експорт ще не реалізовано — поки нотифікація через alert.
        window.alert(t("commandPalette.actions.exportOrders.comingSoon"));
      },
    });
    list.push({
      id: "action-invite-team",
      section: "actions",
      icon: "users",
      title: t("commandPalette.actions.inviteTeam.title"),
      subtitle: t("commandPalette.actions.inviteTeam.subtitle"),
      run: () => {
        window.alert(t("commandPalette.actions.inviteTeam.comingSoon"));
      },
    });

    // ── Замовлення (живі дані) ────────────────
    for (const o of orders) {
      const money = `${currencySymbol(currency)}${Number(o.total).toLocaleString("uk", { minimumFractionDigits: 0 })}`;
      const status = t(`orders.statuses.${o.status}`).toLowerCase();
      list.push({
        id: `order-${o.id}`,
        section: "orders",
        icon: "cart",
        title: `${o.number} — ${o.customer_name}`,
        subtitle: `${money} · ${status}`,
        run: () => navigate("/orders"),
      });
    }

    // ── Товари (живі дані) ────────────────────
    for (const p of products) {
      const money = `${currencySymbol(currency)}${Number(p.price).toLocaleString("uk", { minimumFractionDigits: 0 })}`;
      const stockText = `${p.stock} ${t("commandPalette.stockUnit")}`;
      list.push({
        id: `product-${p.id}`,
        section: "products",
        icon: "box",
        title: p.name,
        subtitle: `${p.sku} · ${money} · ${stockText}`,
        run: () => navigate("/catalog"),
      });
    }

    // ── Клієнти (живі дані) ───────────────────
    for (const c of customers) {
      const spent = `${currencySymbol(currency)}${Number(c.total_spent).toLocaleString("uk", { minimumFractionDigits: 0 })}`;
      const ordersText = `${c.orders_count} ${t("commandPalette.ordersUnit")}`;
      list.push({
        id: `customer-${c.id}`,
        section: "customers",
        icon: "users",
        title: c.name,
        subtitle: `${t(`tiers.${c.tier}`).toLowerCase()} · ${ordersText} · ${spent}`,
        run: () => navigate("/customers"),
      });
    }

    // ── Налаштування ───────────────────────────
    list.push({
      id: "settings-toggle-theme",
      section: "settings",
      icon: "sparkle",
      title: t("commandPalette.settings.toggleTheme.title"),
      subtitle: `${t("tweaks.themes.light")} ⇄ ${t("tweaks.themes.dark")}`,
      hotkey: ["⇧", "D"],
      run: () => update("theme", tweaks.theme === "light" ? "dark" : "light"),
    });
    list.push({
      id: "settings-compact-sidebar",
      section: "settings",
      icon: "menu",
      title: t("commandPalette.settings.compactSidebar.title"),
      subtitle: t("commandPalette.settings.compactSidebar.subtitle"),
      run: () => update("sidebarCompact", !tweaks.sidebarCompact),
    });
    list.push({
      id: "settings-tweaks",
      section: "settings",
      icon: "settings",
      title: t("commandPalette.settings.tweaks.title"),
      subtitle: t("commandPalette.settings.tweaks.subtitle"),
      run: () => {
        // Поки що просто тригеримо ? довідку — майбутнє: відкриття Tweaks-панелі.
        window.dispatchEvent(new CustomEvent("ait:open-tweaks"));
      },
    });

    return list;
  }, [t, navigate, orders, products, customers, currency, tweaks, update]);

  // Фільтр по заголовку + субтитру (регістр-інсенситив).
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q),
    );
  }, [query, commands]);

  // Групування по секціях + плоский список для навігації клавіатурою.
  const { groups, flat } = useMemo(() => {
    const g: Record<string, Command[]> = {};
    for (const cmd of filtered) {
      (g[cmd.section] ||= []).push(cmd);
    }
    const f = SECTION_ORDER.flatMap((s) => g[s] ?? []);
    return { groups: g, flat: f };
  }, [filtered]);

  // Скидаємо курсор у межі списку при зміні фільтра.
  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(flat.length - 1, h + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = flat[highlight];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flat, highlight, onClose]);

  // Auto-scroll активного елемента у в'юпорт.
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-cmdk-index='${highlight}']`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  if (!open) return null;

  const activeSections = SECTION_ORDER.filter((s) => (groups[s] ?? []).length > 0);

  return (
    <div className="cmdk-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cmdk-card" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("commandPalette.placeholder")}
            className="cmdk-input"
          />
          <span className="kbd">esc</span>
        </div>

        <div className="cmdk-list" ref={listRef}>
          {activeSections.length === 0 && <div className="cmdk-empty">{t("commandPalette.empty")}</div>}
          {activeSections.map((section) => (
            <div key={section}>
              <div className="cmdk-section-label">{t(`commandPalette.sections.${section}`)}</div>
              {groups[section].map((cmd) => {
                const idx = flat.indexOf(cmd);
                const isActive = idx === highlight;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    data-cmdk-index={idx}
                    className={`cmdk-item ${isActive ? "active" : ""}`}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => {
                      cmd.run();
                      onClose();
                    }}
                  >
                    <div className="cmdk-item-icon">
                      <Icon name={cmd.icon} size={16} />
                    </div>
                    <div className="cmdk-item-text">
                      <div className="cmdk-item-title">{cmd.title}</div>
                      <div className="cmdk-item-subtitle">{cmd.subtitle}</div>
                    </div>
                    {cmd.hotkey && (
                      <span className="cmdk-item-hotkey">
                        {cmd.hotkey.map((k, i) => (
                          <kbd className="kbd" key={i}>
                            {k}
                          </kbd>
                        ))}
                      </span>
                    )}
                    {isActive && (
                      <Icon name="arrow_right" size={14} className="cmdk-item-arrow" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <footer className="cmdk-footer">
          <div className="cmdk-hints">
            <span>
              <kbd className="kbd">↑↓</kbd> {t("commandPalette.hints.choose")}
            </span>
            <span>
              <kbd className="kbd">↵</kbd> {t("commandPalette.hints.open")}
            </span>
            <span>
              <kbd className="kbd">esc</kbd> {t("commandPalette.hints.close")}
            </span>
          </div>
          <div className="cmdk-count">
            {flat.length} {t("commandPalette.resultsCount")}
          </div>
        </footer>
      </div>
    </div>
  );
}
