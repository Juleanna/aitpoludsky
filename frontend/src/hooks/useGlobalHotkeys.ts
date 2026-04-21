import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useTweaks } from "@/context/TweaksContext";

// Глобальні клавіатурні скорочення.
// Підтримуються три види:
//   1. Модифікаторні: ⌘K, ⌘/, ⇧D
//   2. Одноклавішні: ?
//   3. Послідовні: G→H, G→O, G→C, G→U, N→P, N→O
//      (друга клавіша має бути натиснута протягом 1 секунди після першої)
//
// Хук активний, коли фокус НЕ в полі вводу (input/textarea/contenteditable),
// щоб не перехоплювати символи під час набору.

type Handlers = {
  openCommandPalette: () => void;
  openShortcuts: () => void;
};

const SEQUENCE_TIMEOUT_MS = 1000;

export function useGlobalHotkeys({ openCommandPalette, openShortcuts }: Handlers) {
  const navigate = useNavigate();
  const { tweaks, update } = useTweaks();

  useEffect(() => {
    let prefix: "g" | "n" | null = null;
    let timer: number | null = null;

    const reset = () => {
      prefix = null;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const startSequence = (which: "g" | "n") => {
      prefix = which;
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(reset, SEQUENCE_TIMEOUT_MS);
    };

    const fireDeferred = (eventName: string) => {
      // Дочекатися, поки цільова сторінка змонтується (через navigate),
      // і вистрілити подію — компонент сторінки її підхопить.
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(eventName));
      }, 120);
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      // ── Модифікаторні ──────────────────────────────
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommandPalette();
        reset();
        return;
      }
      if (meta && e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("ait:toggle-maria"));
        reset();
        return;
      }
      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        update("theme", tweaks.theme === "light" ? "dark" : "light");
        reset();
        return;
      }

      // ── Одноклавішна довідка ──────────────────────
      if (!meta && !e.altKey && e.key === "?") {
        e.preventDefault();
        openShortcuts();
        reset();
        return;
      }

      if (meta || e.altKey) return;

      const key = e.key.toLowerCase();

      // ── Друга клавіша послідовності ───────────────
      if (prefix === "g") {
        const routes: Record<string, string> = {
          h: "/dashboard",
          o: "/orders",
          c: "/catalog",
          u: "/customers",
        };
        if (routes[key]) {
          e.preventDefault();
          navigate(routes[key]);
          reset();
          return;
        }
        reset();
      }
      if (prefix === "n") {
        if (key === "p") {
          e.preventDefault();
          navigate("/catalog");
          fireDeferred("ait:new-product");
          reset();
          return;
        }
        if (key === "o") {
          e.preventDefault();
          navigate("/orders");
          fireDeferred("ait:new-order");
          reset();
          return;
        }
        reset();
      }

      // ── Перша клавіша послідовності ───────────────
      if (!e.shiftKey && key === "g") {
        startSequence("g");
      } else if (!e.shiftKey && key === "n") {
        startSequence("n");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
    };
  }, [navigate, tweaks.theme, update, openCommandPalette, openShortcuts]);
}
