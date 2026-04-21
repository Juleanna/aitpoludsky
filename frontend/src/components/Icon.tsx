import type { SVGProps } from "react";

// Карта SVG-шляхів іконок, що використовуються у додатку.
// Усі оптимізовані під 24×24 viewBox, stroke-based, 1.75px.
const PATHS: Record<string, string> = {
  home: "M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V10z",
  cart: "M3 3h2l2.5 12h11l2-8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  box: "M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5m0 0l9-5m-9 5v10",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.5 7.5 0 0 0-.1-1.3l2-1.6-2-3.5-2.4 1a7.5 7.5 0 0 0-2.2-1.3L14 2h-4l-.7 2.3a7.5 7.5 0 0 0-2.2 1.3l-2.4-1-2 3.5 2 1.6a7.5 7.5 0 0 0 0 2.6l-2 1.6 2 3.5 2.4-1a7.5 7.5 0 0 0 2.2 1.3L10 22h4l.7-2.3a7.5 7.5 0 0 0 2.2-1.3l2.4 1 2-3.5-2-1.6c.06-.42.1-.86.1-1.3z",
  plus: "M12 5v14M5 12h14",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  arrow_right: "M5 12h14M13 5l7 7-7 7",
  check: "M5 12l5 5L20 7",
  package:
    "M12 2l9 4.5v11L12 22 3 17.5v-11L12 2zm0 2.2L5.5 7.3 12 10.4l6.5-3.1L12 4.2zM5 9.2v7.4l6 3V12.2L5 9.2zm14 0l-6 3V19.6l6-3V9.2z",
  trending_up: "M3 17l6-6 4 4 8-8M14 7h7v7",
  // Нові іконки для меню-прототипу
  chart: "M3 21h18M6 17V10m5 7V6m5 11v-8m5 8v-4",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  tag: "M20 12l-9 9a2 2 0 0 1-2.83 0l-6.17-6.17a2 2 0 0 1 0-2.83L11 3h9v9zM7 7h.01",
  leaf: "M21 3c-10 0-16 5-16 14 0 2 .5 3.5 1.5 4.5M5 21s3-9 16-14",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  store:
    "M3 9l1.5-5h15L21 9M4 9v11h16V9M4 9h16M9 20v-6h6v6",
  credit:
    "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 10h20M7 15h4",
  globe:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a14 14 0 0 1 0 20M12 2a14 14 0 0 0 0 20",
  grid: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm14 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  sparkles: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
};

type Props = SVGProps<SVGSVGElement> & { name: keyof typeof PATHS | string; size?: number };

export function Icon({ name, size = 16, ...rest }: Props) {
  const d = PATHS[name] ?? PATHS.box;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
