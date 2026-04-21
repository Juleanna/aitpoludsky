// Стилізований wordmark бренду: "ait·poludsky".
// - "ait" — приглушений Geist (sans-serif)
// - "·" — акцентна середня крапка
// - "poludsky" — Newsreader italic з descender-ami (p, l, d, k, y)
//   Нижня частина більша і виразніша — домінує візуально,
//   тоді як "ait" виконує роль префікса-підпису.
type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  /** Якщо true — рендер без гап-ів, щоб вписатися в компактні місця */
  tight?: boolean;
};

const SIZE_MAP: Record<Size, { root: number; aitScale: number }> = {
  sm: { root: 14, aitScale: 0.9 },
  md: { root: 20, aitScale: 0.82 },
  lg: { root: 30, aitScale: 0.76 },
};

export function Brand({ size = "md", tight = false }: Props) {
  const { root, aitScale } = SIZE_MAP[size];
  return (
    <span
      className="brand-word"
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: tight ? 0 : 1,
        fontSize: root,
        lineHeight: 1,
        letterSpacing: "-0.01em",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 500,
          color: "var(--text-3)",
          letterSpacing: "0.04em",
          fontSize: `${aitScale}em`,
          textTransform: "lowercase",
        }}
      >
        ait
      </span>
      <span
        aria-hidden
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--accent-ink)",
          fontStyle: "italic",
          padding: "0 3px",
          fontSize: "1.05em",
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 500,
          color: "var(--text)",
          letterSpacing: "-0.02em",
        }}
      >
        poludsky
      </span>
    </span>
  );
}
