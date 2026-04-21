import { useTranslation } from "react-i18next";

import { useTweaks } from "@/context/TweaksContext";
import type { Seasonal } from "@/context/TweaksContext";
import { Icon } from "./Icon";

// Банер поточного сезону на дашборді. Реагує на tweaks.seasonal.
// Повідомлення + іконка для кожного з 4 сезонів (весна/літо/різдво/чорна пʼятниця).

const ICONS: Record<Seasonal, string> = {
  spring: "leaf",
  summer: "sparkle",
  christmas: "star",
  blackFriday: "tag",
};

export function SeasonalBanner() {
  const { t } = useTranslation();
  const { tweaks } = useTweaks();
  const season = tweaks.seasonal;

  return (
    <div className="seasonal-banner" data-season={season}>
      <span className="seasonal-dot" />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={ICONS[season]} size={14} />
      </div>
      <div style={{ flex: 1 }}>
        <strong>{t(`seasonalBanner.${season}.title`)}</strong>
        <span style={{ color: "var(--text-3)", marginLeft: 8 }}>
          · {t(`seasonalBanner.${season}.desc`)}
        </span>
      </div>
    </div>
  );
}
