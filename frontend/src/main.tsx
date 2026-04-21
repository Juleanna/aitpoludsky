import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted шрифти (fontsource) — кожен CSS-файл містить @font-face
// з усіма subsets (latin + cyrillic + ін.) і правильним unicode-range.
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/newsreader/500-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import { App } from "./App";
import "./i18n";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/overlay.css";
import "./styles/landing.css";

const rootEl = document.getElementById("app");
if (!rootEl) throw new Error("#app element not found");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
