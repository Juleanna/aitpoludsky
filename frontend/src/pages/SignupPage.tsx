import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";

export function SignupPage() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signup({ email, password, full_name: fullName });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const body = err.body as Record<string, string[]> | null;
        const first = body && Object.values(body)[0]?.[0];
        setError(first ?? t("auth.checkFields"));
      } else {
        setError(t("auth.signupError"));
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
            {t("auth.signupTitle")}
          </h1>
          <p style={{ color: "var(--text-2)", margin: 0, fontSize: 13 }}>{t("auth.signupSubtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)" }}>
              {t("auth.fullName")}
            </span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </label>
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
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </label>
          {error && <div style={{ fontSize: 12, color: "var(--err)" }}>{error}</div>}
          <button type="submit" className="btn accent" disabled={busy} style={{ justifyContent: "center", padding: "10px 14px" }}>
            {busy ? t("auth.signingUp") : t("auth.signup")}
          </button>
        </form>
        <div style={{ marginTop: 18, fontSize: 13, color: "var(--text-2)", textAlign: "center" }}>
          {t("auth.haveAccount")}{" "}
          <Link to="/login" style={{ color: "var(--accent-ink)" }}>
            {t("auth.goLogin")}
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
