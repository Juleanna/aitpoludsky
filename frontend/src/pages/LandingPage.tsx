import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Icon } from "@/components/Icon";
import { UI_LANGUAGES } from "@/i18n";
import { useAuth } from "@/context/AuthContext";

// Мови, для яких показуємо переклад картки товару в секції i18n
const SHOWCASE_LANGS = ["uk", "en", "pl", "de"] as const;
type ShowcaseLang = (typeof SHOWCASE_LANGS)[number];

// Демо-дані картки товару різними мовами
const SHOWCASE_PRODUCT: Record<ShowcaseLang, { name: string; desc: string; price: string }> = {
  uk: { name: "Еспресо-бленд «Вранці»", desc: "Темна обсмажка, шоколадні ноти, ідеально для ранку.", price: "₴420" },
  en: { name: "Morning Espresso Blend", desc: "Dark roast, chocolate notes, perfect for the morning.", price: "$12" },
  pl: { name: "Mieszanka Espresso «Poranek»", desc: "Ciemne palenie, czekoladowe nuty, idealna na poranek.", price: "45 zł" },
  de: { name: "Espresso-Mischung «Morgen»", desc: "Dunkle Röstung, schokoladige Noten, perfekt für den Morgen.", price: "€10" },
};

export function LandingPage() {
  const { t, i18n } = useTranslation();
  const { status } = useAuth();
  const [previewLang, setPreviewLang] = useState<ShowcaseLang>("uk");

  const ctaTarget = status === "authenticated" ? "/dashboard" : "/signup";
  const ctaLabel = status === "authenticated" ? t("landing.nav.dashboard") : t("landing.hero.primaryCta");
  const showcase = SHOWCASE_PRODUCT[previewLang];

  return (
    <div className="lp-root">
      {/* ── Навігація ──────────────────────────────────────────────── */}
      <header className="lp-top">
        <div className="lp-top-inner">
          <Link to="/" className="lp-brand">
            <div className="lp-brand-mark">a</div>
            <span className="lp-brand-name">{t("app.name")}</span>
          </Link>
          <nav className="lp-nav">
            <a href="#features">{t("landing.nav.features")}</a>
            <a href="#how-it-works">{t("landing.nav.howItWorks")}</a>
            <a href="#i18n">{t("landing.nav.translations")}</a>
          </nav>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {status === "authenticated" ? (
              <Link to="/dashboard" className="lp-btn lp-btn-primary">
                {t("landing.nav.dashboard")} <Icon name="arrow_right" size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="lp-nav" style={{ color: "var(--text-2)", fontSize: 13, textDecoration: "none" }}>
                  {t("landing.nav.login")}
                </Link>
                <Link to="/signup" className="lp-btn lp-btn-primary">
                  {t("landing.nav.signup")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-hero-inner">
          <div>
            <span className="lp-badge">
              <span className="lp-badge-dot" />
              {t("landing.hero.badge")}
            </span>
            <h1>
              {t("landing.hero.titleBefore")} <em>{t("landing.hero.titleAccent")}</em>{" "}
              {t("landing.hero.titleAfter")}
            </h1>
            <p className="lp-sub">{t("landing.hero.subtitle")}</p>
            <div className="lp-cta-row">
              <Link to={ctaTarget} className="lp-btn lp-btn-primary">
                {ctaLabel} <Icon name="arrow_right" size={14} />
              </Link>
              {status !== "authenticated" && (
                <Link to="/login" className="lp-btn lp-btn-ghost">
                  {t("landing.hero.secondaryCta")}
                </Link>
              )}
            </div>
            <div className="lp-trust">
              <span>{t("landing.hero.trust1")}</span>
              <span>{t("landing.hero.trust2")}</span>
              <span>{t("landing.hero.trust3")}</span>
            </div>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* ── Фічі ──────────────────────────────────────────────────── */}
      <section id="features" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-tag">{t("landing.features.tag")}</div>
          <h2 className="lp-section-title">
            {t("landing.features.titleBefore")} <em>{t("landing.features.titleAccent")}</em>
          </h2>
          <p className="lp-section-lede">{t("landing.features.lede")}</p>
          <div className="lp-features">
            <Feature icon="box" tKey="catalog" />
            <Feature icon="cart" tKey="orders" />
            <Feature icon="users" tKey="customers" />
            <Feature icon="package" tKey="inventory" />
            <Feature icon="trending_up" tKey="discounts" />
            <Feature icon="home" tKey="storefront" />
          </div>
        </div>
      </section>

      {/* ── Багатомовність ────────────────────────────────────────── */}
      <section id="i18n" className="lp-section lp-i18n">
        <div className="lp-section-inner">
          <div className="lp-i18n-grid">
            <div>
              <div className="lp-section-tag">{t("landing.i18n.tag")}</div>
              <h2 className="lp-section-title" style={{ marginBottom: 14 }}>
                {t("landing.i18n.titleBefore")} <em>{t("landing.i18n.titleAccent")}</em>
              </h2>
              <p className="lp-section-lede" style={{ marginBottom: 24 }}>
                {t("landing.i18n.lede")}
              </p>
              <div className="lp-trust" style={{ marginTop: 0 }}>
                <span>{t("landing.i18n.point1")}</span>
                <span>{t("landing.i18n.point2")}</span>
              </div>
            </div>

            <div>
              <div className="lp-lang-tabs">
                {SHOWCASE_LANGS.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`lp-lang-tab ${code === previewLang ? "active" : ""}`}
                    onClick={() => setPreviewLang(code)}
                  >
                    {t(`languages.${code}`)}
                  </button>
                ))}
              </div>
              <article className="lp-lang-card">
                <div className="lp-lang-card-sku">SKU · COF-001</div>
                <h3 className="lp-lang-card-name">{showcase.name}</h3>
                <p className="lp-lang-card-desc">{showcase.desc}</p>
                <div className="lp-lang-card-price">{showcase.price}</div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ── Статистика ────────────────────────────────────────────── */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-section-inner">
          <div className="lp-stats">
            <Stat value="10" unit={t("landing.stats.launchUnit")} label={t("landing.stats.launchLabel")} />
            <Stat value="4+" label={t("landing.stats.languagesLabel")} />
            <Stat value={t("landing.stats.freeValue")} label={t("landing.stats.freeLabel")} />
            <Stat value="∞" label={t("landing.stats.tenantsLabel")} />
          </div>
        </div>
      </section>

      {/* ── Як це працює ──────────────────────────────────────────── */}
      <section id="how-it-works" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-tag">{t("landing.howItWorks.tag")}</div>
          <h2 className="lp-section-title">
            {t("landing.howItWorks.titleBefore")} <em>{t("landing.howItWorks.titleAccent")}</em>
          </h2>
          <p className="lp-section-lede">{t("landing.howItWorks.lede")}</p>
          <div className="lp-steps">
            <Step num="01" tKey="step1" />
            <Step num="02" tKey="step2" />
            <Step num="03" tKey="step3" />
          </div>
        </div>
      </section>

      {/* ── Фінальний CTA ─────────────────────────────────────────── */}
      <section style={{ display: "flex", justifyContent: "center" }}>
        <div className="lp-final">
          <h2>{t("landing.finalCta.title")}</h2>
          <p>{t("landing.finalCta.subtitle")}</p>
          <Link to={ctaTarget} className="lp-btn lp-btn-primary">
            {ctaLabel} <Icon name="arrow_right" size={14} />
          </Link>
        </div>
      </section>

      {/* ── Футер ─────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="lp-brand-mark" style={{ width: 24, height: 24, fontSize: 15, borderRadius: 7 }}>
              a
            </div>
            <span>{t("landing.footer.copyright", { year: new Date().getFullYear() })}</span>
          </div>
          <select
            value={i18n.language}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
            aria-label={t("topbar.language")}
          >
            {UI_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </footer>
    </div>
  );
}

/* ── Допоміжні компоненти ────────────────────────────────────── */

function Feature({ icon, tKey }: { icon: string; tKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="lp-feature">
      <div className="lp-feature-icon">
        <Icon name={icon} size={20} />
      </div>
      <h3>{t(`landing.features.${tKey}Title`)}</h3>
      <p>{t(`landing.features.${tKey}Desc`)}</p>
    </div>
  );
}

function Step({ num, tKey }: { num: string; tKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="lp-step">
      <div className="lp-step-num">{num}</div>
      <h3>{t(`landing.howItWorks.${tKey}Title`)}</h3>
      <p>{t(`landing.howItWorks.${tKey}Desc`)}</p>
    </div>
  );
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="lp-stat">
      <div className="lp-stat-value">
        {value}
        {unit && <span style={{ fontSize: "0.4em", marginLeft: 4, fontStyle: "normal" }}>{unit}</span>}
      </div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

/* ── Моковий скрин дашборду у Hero ───────────────────────────── */

function HeroMock() {
  const bars = [30, 42, 38, 58, 45, 66, 52, 78, 70, 85, 72, 92];
  return (
    <div className="lp-mock">
      <div className="lp-mock-chrome">
        <span />
        <span />
        <span />
      </div>
      <div className="lp-mock-kpi">
        <div className="lp-mock-card">
          <div className="lp-mock-label">ПРОДАЖІ</div>
          <div className="lp-mock-value">₴14 280</div>
          <span className="lp-mock-chip">+12.4%</span>
        </div>
        <div className="lp-mock-card">
          <div className="lp-mock-label">ЗАМОВЛЕННЯ</div>
          <div className="lp-mock-value">61</div>
          <span className="lp-mock-chip">+18.2%</span>
        </div>
      </div>
      <div className="lp-mock-chart">
        {bars.map((h, i) => (
          <div key={i} className="lp-mock-bar" style={{ height: `${h}%`, opacity: 0.4 + (i / bars.length) * 0.6 }} />
        ))}
      </div>
      <div className="lp-mock-foot">
        <span>14 днів</span>
        <span>● LIVE</span>
      </div>
    </div>
  );
}
