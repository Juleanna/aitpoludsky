// Стилізований wordmark бренду: "AIT · Poludsky".
// - "AIT" — uppercase Geist (sans-serif), розширений трекінг як для акроніма
// - "·" — акцентна середня крапка
// - "Poludsky" — Newsreader italic, Title case, з descender-ами (p, l, d, k, y)
//   які формують виразну нижню лінію і домінують візуально.
type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  /** Якщо true — рендер без гап-ів, щоб вписатися в компактні місця */
  tight?: boolean;
};

const SIZE_MAP: Record<Size, { root: number; aitScale: number }> = {
  sm: { root: 14, aitScale: 0.78 },
  md: { root: 20, aitScale: 0.72 },
  lg: { root: 30, aitScale: 0.66 },
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
          fontWeight: 600,
          color: "var(--text-2)",
          letterSpacing: "0.1em",
          fontSize: `${aitScale}em`,
          textTransform: "uppercase",
        }}
      >
        AIT
      </span>
      <span
        aria-hidden
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--accent-ink)",
          fontStyle: "italic",
          padding: "0 5px",
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
        Poludsky
      </span>
    </span>
  );
}
