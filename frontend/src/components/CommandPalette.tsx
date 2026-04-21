import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Icon } from "./Icon";

// Командна палітра (⌘K): фільтрований список навігаційних та action-команд.
// Мінімальна реалізація — тільки навігація та кілька швидких дій.
// Arrows: ↑/↓ для навігації по списку, Enter — виконати, Esc — закрити.

type Command = {
  /** Ключ у локалях для назви */
  labelKey: string;
  /** Іконка з нашого набору */
  icon: string;
  /** Шлях для navigate; або undefined якщо action */
  to?: string;
  /** Кастомна дія (замість navigate) */
  run?: () => void;
};

const COMMANDS: Command[] = [
  { labelKey: "nav.dashboard", icon: "home", to: "/dashboard" },
  { labelKey: "nav.orders", icon: "cart", to: "/orders" },
  { labelKey: "nav.catalog", icon: "box", to: "/catalog" },
  { labelKey: "nav.customers", icon: "users", to: "/customers" },
  { labelKey: "nav.discounts", icon: "tag", to: "/discounts" },
  { labelKey: "nav.inventory", icon: "package", to: "/inventory" },
  { labelKey: "nav.inbox", icon: "chat", to: "/inbox" },
  { labelKey: "nav.storefront", icon: "globe", to: "/storefront" },
  { labelKey: "nav.shops", icon: "settings", to: "/shops" },
  { labelKey: "nav.onboarding", icon: "sparkle", to: "/onboarding" },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // При відкритті — фокус у поле + скид фільтра.
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      inputRef.current?.focus();
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter((c) => t(c.labelKey).toLowerCase().includes(q));
  }, [query, t]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(filtered.length - 1, h + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[highlight];
        if (cmd) {
          if (cmd.to) navigate(cmd.to);
          cmd.run?.();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, highlight, navigate, onClose]);

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cmdk-card" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            placeholder={t("commandPalette.placeholder")}
            className="cmdk-input"
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmdk-list">
          {filtered.length === 0 && (
            <div className="cmdk-empty">{t("commandPalette.empty")}</div>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.labelKey}
              type="button"
              className={`cmdk-item ${i === highlight ? "active" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                if (c.to) navigate(c.to);
                c.run?.();
                onClose();
              }}
            >
              <Icon name={c.icon} size={14} />
              <span>{t(c.labelKey)}</span>
              {i === highlight && <span className="kbd" style={{ marginLeft: "auto" }}>↵</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
