import { useEffect, useState } from "react";

type Props = { value: number; prefix?: string; fractionDigits?: number };

export function Counter({ value, prefix = "", fractionDigits = 0 }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 700;
    let rafId = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(value * eased);
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  const formatted = shown.toLocaleString("uk", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return (
    <span>
      {prefix}
      {formatted}
    </span>
  );
}
