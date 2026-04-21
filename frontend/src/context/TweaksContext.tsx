import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

// Tweaks — глобальні UI-налаштування: тема, акцент, щільність сайдбара, сезон.
// Стан зберігається в localStorage і застосовується до :root через CSS custom properties
// (точно як у прототипі Kramnycia — збережена параметризація OKLCH-акцентів).

export type Theme = "light" | "dark";
export type Accent = "amber" | "cobalt" | "moss" | "rose" | "ink";
export type Seasonal = "spring" | "summer" | "christmas" | "blackFriday";

export type TweaksState = {
  theme: Theme;
  accent: Accent;
  sidebarCompact: boolean;
  seasonal: Seasonal;
};

const STORAGE_KEY = "ait_tweaks";

const DEFAULTS: TweaksState = {
  theme: "light",
  accent: "amber",
  sidebarCompact: false,
  seasonal: "spring",
};

// Параметри акцентних кольорів в OKLCH (Hue, Chroma, Lightness + ink варіант).
// Ті самі значення, що були у прототипі.
const ACCENTS: Record<Accent, { h: number; c: number; l: number; inkL: number; inkC: number }> = {
  amber: { h: 55, c: 0.14, l: 0.72, inkL: 0.32, inkC: 0.08 },
  cobalt: { h: 255, c: 0.15, l: 0.58, inkL: 0.32, inkC: 0.14 },
  moss: { h: 150, c: 0.11, l: 0.58, inkL: 0.3, inkC: 0.08 },
  rose: { h: 15, c: 0.15, l: 0.65, inkL: 0.35, inkC: 0.1 },
  ink: { h: 60, c: 0.01, l: 0.25, inkL: 0.15, inkC: 0.01 },
};

// Попередній перегляд акцентів для селектора (colors для swatch-кружечків).
export const ACCENT_PREVIEW: Record<Accent, string> = {
  amber: `oklch(${ACCENTS.amber.l} ${ACCENTS.amber.c} ${ACCENTS.amber.h})`,
  cobalt: `oklch(${ACCENTS.cobalt.l} ${ACCENTS.cobalt.c} ${ACCENTS.cobalt.h})`,
  moss: `oklch(${ACCENTS.moss.l} ${ACCENTS.moss.c} ${ACCENTS.moss.h})`,
  rose: `oklch(${ACCENTS.rose.l} ${ACCENTS.rose.c} ${ACCENTS.rose.h})`,
  ink: `oklch(${ACCENTS.ink.l} ${ACCENTS.ink.c} ${ACCENTS.ink.h})`,
};

function applyTweaks(t: TweaksState) {
  const r = document.documentElement;
  r.setAttribute("data-theme", t.theme);
  const a = ACCENTS[t.accent];
  r.style.setProperty("--accent", `oklch(${a.l} ${a.c} ${a.h})`);
  r.style.setProperty("--accent-ink", `oklch(${a.inkL} ${a.inkC} ${a.h})`);
  r.style.setProperty(
    "--accent-soft",
    t.theme === "dark" ? `oklch(0.3 ${a.c / 3} ${a.h})` : `oklch(0.94 ${a.c / 4} ${a.h})`,
  );
  r.style.setProperty(
    "--accent-line",
    t.theme === "dark" ? `oklch(0.45 ${a.c / 2} ${a.h})` : `oklch(0.82 ${a.c / 2} ${a.h})`,
  );
}

function loadFromStorage(): TweaksState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

type TweaksContextValue = {
  tweaks: TweaksState;
  update: <K extends keyof TweaksState>(key: K, value: TweaksState[K]) => void;
  reset: () => void;
};

const TweaksContext = createContext<TweaksContextValue | null>(null);

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<TweaksState>(() => loadFromStorage());

  // Застосовуємо до :root + зберігаємо в localStorage на кожну зміну.
  useEffect(() => {
    applyTweaks(tweaks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
  }, [tweaks]);

  const update = useCallback(
    <K extends keyof TweaksState>(key: K, value: TweaksState[K]) => {
      setTweaks((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setTweaks(DEFAULTS);
  }, []);

  const value = useMemo(() => ({ tweaks, update, reset }), [tweaks, update, reset]);

  return <TweaksContext.Provider value={value}>{children}</TweaksContext.Provider>;
}

export function useTweaks(): TweaksContextValue {
  const ctx = useContext(TweaksContext);
  if (!ctx) throw new Error("useTweaks must be used inside <TweaksProvider>");
  return ctx;
}
