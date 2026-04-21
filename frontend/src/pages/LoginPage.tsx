import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(t("auth.loginError"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 20 }}>
      <div className="card" style={{ width: 400, maxWidth: "100%", padding: 28 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 className="serif" style={{ fontSize: 32, margin: "0 0 4px", fontStyle: "italic" }}>
            {t("auth.loginTitle", { app: t("app.name") })}
          </h1>
          <p style={{ color: "var(--text-2)", margin: 0, fontSize: 13 }}>{t("auth.loginSubtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)" }}>
              {t("auth.email")}
            </span>
            <input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)" }}>
              {t("auth.password")}
            </span>
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </label>
          {error && <div style={{ fontSize: 12, color: "var(--err)" }}>{error}</div>}
          <button type="submit" className="btn accent" disabled={busy} style={{ justifyContent: "center", padding: "10px 14px" }}>
            {busy ? t("auth.loggingIn") : t("auth.login")}
          </button>
        </form>
        <div style={{ marginTop: 18, fontSize: 13, color: "var(--text-2)", textAlign: "center" }}>
          {t("auth.noAccount")}{" "}
          <Link to="/signup" style={{ color: "var(--accent-ink)" }}>
            {t("auth.goSignup")}
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-sm)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
};
