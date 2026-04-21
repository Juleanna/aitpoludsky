import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as catalogApi from "@/api/catalog";
import * as shopsApi from "@/api/shops";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";

// Транслітерація укр/рос → lat для генерації slug з назви магазину.
const SLUG_TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ъ: "",
  "'": "", "ʼ": "", "`": "",
};

function slugify(raw: string): string {
  const transliterated = raw
    .toLowerCase()
    .split("")
    .map((ch) => (SLUG_TRANSLIT[ch] !== undefined ? SLUG_TRANSLIT[ch] : ch))
    .join("");
  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// 5-кроковий onboarding wizard (крок → заповнення → Далі).
// 1-й крок створює магазин реальним POST /api/shops/, 2-й — перший товар.
// Кроки 3-4 (оплата/доставка) поки що UI-only — значення не зберігаються.

type Category = "coffee" | "clothes" | "cosmetics" | "handmade" | "food" | "other";
const CATEGORIES: Category[] = ["coffee", "clothes", "cosmetics", "handmade", "food", "other"];

type PaymentMethod = "cash" | "card" | "bank" | "qr";
const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "bank", "qr"];

type ShippingMethod = "pickup" | "novaPoshta" | "courier";
const SHIPPING_METHODS: ShippingMethod[] = ["pickup", "novaPoshta", "courier"];

const TOTAL_STEPS = 5;

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh, setActiveSlug } = useShops();

  const [step, setStep] = useState(1);
  const [showVideo, setShowVideo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Крок 1: магазин
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  // slugTouched — користувач редагував поле вручну. Поки false,
  // авто-підставляємо slug із назви магазину.
  const [slugTouched, setSlugTouched] = useState(false);
  // Стан перевірки домену: idle (не перевірено), checking (запит летить),
  // available / taken / reserved / format (результат).
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "reserved" | "format"
  >("idle");
  const [category, setCategory] = useState<Category>("coffee");
  const [createdShopSlug, setCreatedShopSlug] = useState<string | null>(null);

  // Авто-підставляння slug із назви магазину, поки користувач не чіпав поле.
  useEffect(() => {
    if (slugTouched) return;
    setShopSlug(slugify(shopName));
  }, [shopName, slugTouched]);

  // Debounced-перевірка доступності slug. Летить після 400мс тиші.
  useEffect(() => {
    const slug = shopSlug.trim();
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    if (slug.length < 2) {
      setSlugStatus("format");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const result = await shopsApi.checkShopSlug(slug);
        // Ігноруємо застарілу відповідь, якщо значення вже змінилось.
        if (result.slug !== slug.toLowerCase()) return;
        if (result.available) setSlugStatus("available");
        else if (result.reason === "reserved") setSlugStatus("reserved");
        else if (result.reason === "format") setSlugStatus("format");
        else setSlugStatus("taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [shopSlug]);

  // Генерація slug з назви + ретраї з числовим суфіксом, якщо зайнятий.
  async function regenerateSlug() {
    const base = slugify(shopName) || "shop";
    const candidates = [base, ...Array.from({ length: 8 }, (_, i) => `${base}-${i + 2}`)];
    setSlugStatus("checking");
    for (const candidate of candidates) {
      try {
        const result = await shopsApi.checkShopSlug(candidate);
        if (result.available) {
          setShopSlug(candidate);
          setSlugTouched(true);
          setSlugStatus("available");
          return;
        }
      } catch {
        // Продовжуємо пробувати наступного кандидата.
      }
    }
    // Fallback: base + timestamp-шматок.
    const fallback = `${base}-${Date.now().toString(36).slice(-4)}`;
    setShopSlug(fallback);
    setSlugTouched(true);
  }

  // Крок 2: перший товар
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productPrice, setProductPrice] = useState("100");

  // Крок 3: оплата
  const [payments, setPayments] = useState<Set<PaymentMethod>>(new Set(["card"]));

  // Крок 4: доставка
  const [shippings, setShippings] = useState<Set<ShippingMethod>>(new Set(["novaPoshta"]));

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  async function goNext() {
    setError(null);
    setBusy(true);
    try {
      if (step === 1) {
        // Створюємо магазин. Якщо він уже створений раніше в цьому wizard — пропускаємо.
        if (!createdShopSlug) {
          const created = await shopsApi.createShop({
            name: shopName,
            slug: shopSlug,
            currency: "UAH",
            default_language: "uk",
            languages: [],
          });
          setCreatedShopSlug(created.slug);
          await refresh();
          setActiveSlug(created.slug);
        }
      } else if (step === 2 && createdShopSlug && productName && productSku) {
        // Створюємо перший товар у тільки-но створеному магазині.
        await catalogApi.createProduct(createdShopSlug, {
          sku: productSku,
          name: productName,
          price: productPrice,
          stock: 10,
          is_active: true,
        });
      }
      setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[] | string> | null;
        if (body) {
          const first = Object.values(body)[0];
          setError(Array.isArray(first) ? first[0] : String(first));
        } else {
          setError(t("common.error"));
        }
      } else {
        setError(t("common.error"));
      }
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function finish() {
    navigate("/dashboard");
  }

  return (
    <div className="content" style={{ maxWidth: 880 }}>
      {/* Заголовок */}
      <div style={{ textAlign: "center", marginBottom: 24, marginTop: 8 }}>
        <div
          className="mono"
          style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--text-3)" }}
        >
          {t("onboarding.stepOf", { current: step, total: TOTAL_STEPS })}
        </div>
        <h1 className="page-title" style={{ fontSize: 44, marginTop: 12, textAlign: "center" }}>
          {t("onboarding.title")} <em>{t("app.name")}</em>
        </h1>
      </div>

      {/* Welcome video (тільки на кроці 1) */}
      {showVideo && step === 1 && (
        <div className="welcome-video">
          <div className="welcome-video-bg" />
          <div style={{ textAlign: "center", zIndex: 1, position: "relative" }}>
            <div className="welcome-play">
              <Icon name="play" size={20} />
            </div>
            <div className="serif" style={{ fontSize: 24, fontStyle: "italic", marginTop: 12 }}>
              {t("onboarding.videoTitle")}
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              {t("onboarding.videoMeta")}
            </div>
          </div>
          <button
            type="button"
            className="btn ghost"
            style={{ position: "absolute", top: 10, right: 10, color: "white" }}
            onClick={() => setShowVideo(false)}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>
      )}

      {/* Степпер */}
      <div className="onb-steps">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
          <div key={n} style={{ display: "contents" }}>
            <div className={`onb-step ${n === step ? "current" : ""} ${n < step ? "done" : ""}`}>
              <div className="onb-step-circle">
                {n < step ? <Icon name="check" size={12} /> : <span className="mono">{n}</span>}
              </div>
              <span className="onb-step-label">{t(`onboarding.steps.${n}`)}</span>
            </div>
            {n < TOTAL_STEPS && <div className="onb-step-line" />}
          </div>
        ))}
      </div>

      {/* Контент кроку */}
      <div className="card" style={{ padding: 32 }}>
        {step === 1 && (
          <div className="grid g-2" style={{ gap: 20 }}>
            <Field label={t("onboarding.shop.name")}>
              <input
                className="onb-input"
                value={shopName}
                required
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t("onboarding.shop.namePlaceholder")}
              />
            </Field>
            <Field label={t("onboarding.shop.domain")}>
              <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
                <div className="onb-input-with-suffix" style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={shopSlug}
                    required
                    pattern="[a-z0-9-]+"
                    onChange={(e) => {
                      setShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      setSlugTouched(true);
                    }}
                    placeholder="my-shop"
                  />
                  <span>.aitpoludsky.shop</span>
                </div>
                <button
                  type="button"
                  className="btn ghost icon"
                  onClick={() => void regenerateSlug()}
                  disabled={!shopName.trim()}
                  aria-label={t("onboarding.shop.domainGenerate")}
                  title={t("onboarding.shop.domainGenerate")}
                >
                  <Icon name="sparkle" size={14} />
                </button>
              </div>
              <div
                style={{
                  fontSize: 11,
                  marginTop: 4,
                  color:
                    slugStatus === "available"
                      ? "var(--ok, #3a7a3a)"
                      : slugStatus === "taken" || slugStatus === "reserved" || slugStatus === "format"
                        ? "var(--err)"
                        : "var(--text-3)",
                }}
              >
                {slugStatus === "checking" && t("onboarding.shop.domainChecking")}
                {slugStatus === "available" && `✓ ${t("onboarding.shop.domainAvailable")}`}
                {slugStatus === "taken" && `✗ ${t("onboarding.shop.domainTaken")}`}
                {slugStatus === "reserved" && `✗ ${t("onboarding.shop.domainReserved")}`}
                {slugStatus === "format" && t("onboarding.shop.domainFormat")}
                {slugStatus === "idle" && t("onboarding.shop.domainHint")}
              </div>
            </Field>
            <Field label={t("onboarding.shop.category")} colSpan={2}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={c === category ? "btn accent" : "btn"}
                    onClick={() => setCategory(c)}
                  >
                    {t(`onboarding.categories.${c}`)}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid g-2" style={{ gap: 20 }}>
            <Field label={t("onboarding.product.name")}>
              <input
                className="onb-input"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t("onboarding.product.namePlaceholder")}
              />
            </Field>
            <Field label={t("onboarding.product.sku")}>
              <input
                className="onb-input"
                style={{ fontFamily: "var(--font-mono)" }}
                value={productSku}
                onChange={(e) => setProductSku(e.target.value.toUpperCase())}
                placeholder="SKU-001"
              />
            </Field>
            <Field label={t("onboarding.product.price")}>
              <input
                className="onb-input"
                type="number"
                min="0"
                step="0.01"
                style={{ fontFamily: "var(--font-mono)" }}
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
            </Field>
            <div style={{ gridColumn: "1/-1", fontSize: 12, color: "var(--text-3)" }}>
              {t("onboarding.product.hint")}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ color: "var(--text-2)", margin: "0 0 16px" }}>
              {t("onboarding.payment.lede")}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PAYMENT_METHODS.map((m) => {
                const on = payments.has(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className={on ? "btn accent" : "btn"}
                    onClick={() => setPayments(toggle(payments, m))}
                  >
                    {on && <Icon name="check" size={12} />} {t(`onboarding.payment.methods.${m}`)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p style={{ color: "var(--text-2)", margin: "0 0 16px" }}>
              {t("onboarding.shipping.lede")}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SHIPPING_METHODS.map((m) => {
                const on = shippings.has(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className={on ? "btn accent" : "btn"}
                    onClick={() => setShippings(toggle(shippings, m))}
                  >
                    {on && <Icon name="check" size={12} />} {t(`onboarding.shipping.methods.${m}`)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div
              style={{
                fontSize: 48,
                marginBottom: 8,
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
              }}
            >
              🎉
            </div>
            <h2
              className="serif"
              style={{ fontSize: 28, fontStyle: "italic", margin: "0 0 8px" }}
            >
              {t("onboarding.launch.title")}
            </h2>
            <p style={{ color: "var(--text-2)", maxWidth: 480, margin: "0 auto 20px" }}>
              {t("onboarding.launch.desc")}
            </p>
            <button type="button" className="btn accent" onClick={finish} style={{ padding: "10px 20px" }}>
              {t("onboarding.launch.cta")} <Icon name="arrow_right" size={14} />
            </button>
          </div>
        )}

        {/* Помилка валідації */}
        {error && (
          <div style={{ marginTop: 16, color: "var(--err)", fontSize: 12 }}>{error}</div>
        )}

        {/* Кнопки навігації (на step 5 — приховано, бо є власний CTA) */}
        {step < TOTAL_STEPS && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid var(--line)",
            }}
          >
            <button
              type="button"
              className="btn ghost"
              onClick={goBack}
              disabled={step === 1 || busy}
            >
              <Icon name="arrow_left" size={14} /> {t("common.back")}
            </button>
            <button
              type="button"
              className="btn accent"
              onClick={goNext}
              disabled={
                busy ||
                (step === 1 &&
                  (!shopName ||
                    !shopSlug ||
                    slugStatus === "taken" ||
                    slugStatus === "reserved" ||
                    slugStatus === "format" ||
                    slugStatus === "checking"))
              }
            >
              {busy ? "…" : t("common.next")} <Icon name="arrow_right" size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  colSpan,
}: {
  label: string;
  children: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <div style={colSpan ? { gridColumn: `1 / span ${colSpan}` } : undefined}>
      <label className="onb-label">{label}</label>
      {children}
    </div>
  );
}
