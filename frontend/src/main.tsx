import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

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
