import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ACCENT_PREVIEW, useTweaks } from "@/context/TweaksContext";
import type { Accent, Seasonal, Theme } from "@/context/TweaksContext";
import { Icon } from "./Icon";

const THEMES: Theme[] = ["light", "dark"];
const ACCENTS: Accent[] = ["amber", "cobalt", "moss", "rose", "ink"];
const SEASONS: Seasonal[] = ["spring", "summer", "christmas", "blackFriday"];

// Плаваюча кнопка у правому нижньому куті + панель налаштувань.
// Видима завжди (на лендингу теж) — тому рендериться на верхньому рівні App.
export function TweaksButton() {
  const { t } = useTranslation();
  const { tweaks, update, reset } = useTweaks();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="tweaks-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("tweaks.openLabel")}
        title={t("tweaks.openLabel")}
      >
        <Icon name="sparkle" size={14} />
        <span>Tweaks</span>
      </button>

      <aside className={`tweaks ${open ? "open" : ""}`} aria-hidden={!open}>
        <header className="tweaks-head">
          <h3 className="tweaks-title">Tweaks</h3>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--text-3)",
                background: "transparent",
                cursor: "pointer",
                padding: "4px 8px",
              }}
              title={t("tweaks.resetTitle")}
            >
              {t("tweaks.reset")}
            </button>
            <button
              type="button"
              className="btn ghost icon"
              onClick={() => setOpen(false)}
              aria-label={t("common.close")}
            >
              ×
            </button>
          </div>
        </header>

        <div className="tweaks-body">
          {/* Тема */}
          <div className="tweak-group">
            <div className="tweak-label">{t("tweaks.theme")}</div>
            <div className="tweak-opts">
              {THEMES.map((th) => (
                <button
                  key={th}
                  type="button"
                  className={`tweak-opt ${tweaks.theme === th ? "active" : ""}`}
                  onClick={() => update("theme", th)}
                >
                  {t(`tweaks.themes.${th}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Акцент */}
          <div className="tweak-group">
            <div className="tweak-label">{t("tweaks.accent")}</div>
            <div className="tweak-swatches">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`tweak-swatch ${tweaks.accent === a ? "active" : ""}`}
                  onClick={() => update("accent", a)}
                  style={{ background: ACCENT_PREVIEW[a] }}
                  aria-label={t(`tweaks.accents.${a}`)}
                  title={t(`tweaks.accents.${a}`)}
                />
              ))}
            </div>
          </div>

          {/* Сайдбар */}
          <div className="tweak-group">
            <div className="tweak-label">{t("tweaks.sidebar")}</div>
            <div className="tweak-opts">
              <button
                type="button"
                className={`tweak-opt ${!tweaks.sidebarCompact ? "active" : ""}`}
                onClick={() => update("sidebarCompact", false)}
              >
                {t("tweaks.sidebarModes.expanded")}
              </button>
              <button
                type="button"
                className={`tweak-opt ${tweaks.sidebarCompact ? "active" : ""}`}
                onClick={() => update("sidebarCompact", true)}
              >
                {t("tweaks.sidebarModes.compact")}
              </button>
            </div>
          </div>

          {/* Сезон */}
          <div className="tweak-group">
            <div className="tweak-label">{t("tweaks.seasonal")}</div>
            <div className="tweak-opts">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tweak-opt ${tweaks.seasonal === s ? "active" : ""}`}
                  onClick={() => update("seasonal", s)}
                >
                  {t(`tweaks.seasons.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
