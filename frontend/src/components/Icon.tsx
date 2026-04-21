import type { ReactNode, SVGProps } from "react";

// Набір SVG-іконок, перенесених 1:1 з прототипу Kramnycia.
// Усі використовують viewBox 20×20 і stroke-based рендер із strokeWidth=1.5.
const ICONS: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M3 10.5L10 4l7 6.5" />
      <path d="M4.5 9.5V17h11V9.5" />
    </>
  ),
  box: (
    <>
      <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" />
      <path d="M3 6l7 3 7-3M10 9v9" />
    </>
  ),
  cart: (
    <>
      <circle cx="7" cy="16" r="1.5" />
      <circle cx="14" cy="16" r="1.5" />
      <path d="M2 3h2l2 10h10l2-7H5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 17V3M3 17h14" />
      <path d="M6 13V9M10 13V6M14 13v-3" />
    </>
  ),
  users: (
    <>
      <circle cx="8" cy="7" r="3" />
      <path d="M3 17c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="14" cy="6" r="2.5" />
      <path d="M13 11c2 0 4 1.5 4 4" />
    </>
  ),
  tag: (
    <>
      <path d="M3 3h6l8 8-6 6-8-8V3z" />
      <circle cx="6.5" cy="6.5" r="1" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="5" width="14" height="11" rx="2" />
      <path d="M3 8h14M14 12h1" />
    </>
  ),
  truck: (
    <>
      <rect x="2" y="6" width="9" height="8" />
      <path d="M11 9h4l2 3v2h-6" />
      <circle cx="6" cy="15" r="1.5" />
      <circle cx="14" cy="15" r="1.5" />
    </>
  ),
  bell: (
    <>
      <path d="M5 9a5 5 0 1110 0v3l1.5 2.5h-13L5 12V9z" />
      <path d="M8 16.5a2 2 0 004 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.5 3.5l2 2M14.5 14.5l2 2M3.5 16.5l2-2M14.5 5.5l2-2" />
    </>
  ),
  plus: <path d="M10 4v12M4 10h12" />,
  search: (
    <>
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l4 4" />
    </>
  ),
  arrow_up: <path d="M10 16V4M5 9l5-5 5 5" />,
  arrow_down: <path d="M10 4v12M5 11l5 5 5-5" />,
  arrow_right: <path d="M4 10h12M11 5l5 5-5 5" />,
  arrow_left: <path d="M16 10H4M9 5l-5 5 5 5" />,
  check: <path d="M4 10l4 4 8-8" />,
  dot: <circle cx="10" cy="10" r="2" />,
  store: (
    <>
      <path d="M3 8l1-4h12l1 4M3 8v9h14V8M3 8h14" />
      <path d="M8 17v-4h4v4" />
    </>
  ),
  filter: <path d="M3 5h14M6 10h8M8 15h4" />,
  sparkle: <path d="M10 3v4M10 13v4M3 10h4M13 10h4M5 5l2 2M13 13l2 2M5 15l2-2M13 7l2-2" />,
  globe: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M3 10h14M10 3c2 2 3 4 3 7s-1 5-3 7c-2-2-3-4-3-7s1-5 3-7z" />
    </>
  ),
  chat: <path d="M3 5c0-1 .5-2 2-2h10c1.5 0 2 1 2 2v7c0 1-.5 2-2 2h-5l-3 3v-3H5c-1.5 0-2-1-2-2V5z" />,
  heart: <path d="M10 16s-6-4-6-8a3 3 0 016-1 3 3 0 016 1c0 4-6 8-6 8z" />,
  qr: (
    <>
      <rect x="3" y="3" width="5" height="5" />
      <rect x="12" y="3" width="5" height="5" />
      <rect x="3" y="12" width="5" height="5" />
      <path d="M12 12h2v2M16 12v5M12 16h2" />
    </>
  ),
  credit: (
    <>
      <rect x="2" y="5" width="16" height="11" rx="1.5" />
      <path d="M2 9h16M5 13h3" />
    </>
  ),
  location: (
    <>
      <path d="M10 2a5 5 0 015 5c0 4-5 11-5 11S5 11 5 7a5 5 0 015-5z" />
      <circle cx="10" cy="7" r="2" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="10" r="1" />
      <circle cx="10" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
    </>
  ),
  menu: <path d="M3 6h14M3 10h14M3 14h14" />,
  star: <path d="M10 3l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />,
  book: <path d="M3 4h5a3 3 0 013 3v9a2 2 0 00-2-2H3V4zM17 4h-5a3 3 0 00-3 3v9a2 2 0 012-2h6V4z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="14" height="12" rx="1" />
      <path d="M3 9h14M7 3v4M13 3v4" />
    </>
  ),
  leaf: (
    <>
      <path d="M15 3s-10 2-11 10c-.5 4 4 5 4 5s1-5 4-8 3-7 3-7z" />
      <path d="M4 17c3-3 5-6 7-8" />
    </>
  ),
  drag: (
    <>
      <circle cx="7" cy="5" r="1" />
      <circle cx="7" cy="10" r="1" />
      <circle cx="7" cy="15" r="1" />
      <circle cx="13" cy="5" r="1" />
      <circle cx="13" cy="10" r="1" />
      <circle cx="13" cy="15" r="1" />
    </>
  ),
  keyboard: (
    <>
      <rect x="2" y="5" width="16" height="10" rx="1.5" />
      <path d="M5 8v.5M8 8v.5M11 8v.5M14 8v.5M6 12h8" />
    </>
  ),
  play: <path d="M6 4l10 6-10 6V4z" />,
  download: <path d="M10 3v10M5 9l5 5 5-5M3 17h14" />,
  pencil: <path d="M3 17v-3l10-10 3 3-10 10H3z" />,
  // Кастомні іконки поза прототипом: вихід, склад, тренд.
  logout: (
    <>
      <path d="M7.5 17.5H4.5a1.5 1.5 0 01-1.5-1.5V4a1.5 1.5 0 011.5-1.5h3" />
      <path d="M13 13l4-3-4-3M17 10H8" />
    </>
  ),
  package: (
    <>
      <path d="M10 3l7 3.5v7L10 17l-7-3.5v-7L10 3z" />
      <path d="M3 6.5l7 3.5 7-3.5M10 10v7" />
      <path d="M6.5 5l7 3.5" />
    </>
  ),
  trending_up: (
    <>
      <path d="M3 14l5-5 3 3 6-7" />
      <path d="M13 5h4v4" />
    </>
  ),
  // Аліас для POS каси — сітка квадратів.
  grid: (
    <>
      <rect x="3" y="3" width="5" height="5" />
      <rect x="12" y="3" width="5" height="5" />
      <rect x="3" y="12" width="5" height="5" />
      <rect x="12" y="12" width="5" height="5" />
    </>
  ),
  sparkles: <path d="M10 3v4M10 13v4M3 10h4M13 10h4M5 5l2 2M13 13l2 2M5 15l2-2M13 7l2-2" />,
};

type Props = SVGProps<SVGSVGElement> & { name: string; size?: number };

export function Icon({ name, size = 16, ...rest }: Props) {
  const body = ICONS[name] ?? ICONS.box;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {body}
    </svg>
  );
}
