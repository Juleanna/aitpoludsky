import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", color: "var(--text-3)" }}>
        Завантаження…
      </div>
    );
  }
  if (status === "guest") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", color: "var(--text-3)" }}>
        Завантаження…
      </div>
    );
  }
  if (status === "authenticated") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
