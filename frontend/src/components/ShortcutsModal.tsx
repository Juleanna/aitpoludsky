import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { MOD_KEY } from "@/utils/platform";
import { Icon } from "./Icon";

// Модальне вікно-довідка зі списком клавіатурних скорочень.
// Закривається кліком на overlay, Esc або кнопкою ×.
// MOD_KEY підставляє ⌘ на Mac і Ctrl на інших ОС.

type Shortcut = { labelKey: string; keys: string[] };

const NAVIGATION: Shortcut[] = [
  { labelKey: "shortcuts.nav.commandPalette", keys: [MOD_KEY, "K"] },
  { labelKey: "shortcuts.nav.dashboard", keys: ["G", "H"] },
  { labelKey: "shortcuts.nav.orders", keys: ["G", "O"] },
  { labelKey: "shortcuts.nav.catalog", keys: ["G", "C"] },
  { labelKey: "shortcuts.nav.customers", keys: ["G", "U"] },
];

const ACTIONS: Shortcut[] = [
  { labelKey: "shortcuts.actions.newProduct", keys: ["N", "P"] },
  { labelKey: "shortcuts.actions.newOrder", keys: ["N", "O"] },
  { labelKey: "shortcuts.actions.openMaria", keys: [MOD_KEY, "/"] },
  { labelKey: "shortcuts.actions.toggleTheme", keys: ["⇧", "D"] },
  { labelKey: "shortcuts.actions.thisHelp", keys: ["?"] },
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="shortcuts-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="shortcuts-card" onClick={(e) => e.stopPropagation()}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 className="serif" style={{ margin: 0, fontSize: 28, fontStyle: "italic" }}>
            {t("shortcuts.title")}
          </h2>
          <button type="button" className="btn ghost icon" onClick={onClose} aria-label={t("common.close")}>
            <Icon name="check" size={14} style={{ opacity: 0 }} />×
          </button>
        </header>

        <div className="shortcuts-grid">
          <Column title={t("shortcuts.sections.navigation")} items={NAVIGATION} />
          <Column title={t("shortcuts.sections.actions")} items={ACTIONS} />
        </div>
      </div>
    </div>
  );
}

function Column({ title, items }: { title: string; items: Shortcut[] }) {
  const { t } = useTranslation();
  return (
    <div>
      <div
        className="mono"
        style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 10 }}
      >
        {title.toUpperCase()}
      </div>
      {items.map((s) => (
        <div className="shortcut-row" key={s.labelKey}>
          <span>{t(s.labelKey)}</span>
          <span className="shortcut-keys">
            {s.keys.map((k, i) => (
              <kbd key={i} className="kbd">
                {k}
              </kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
