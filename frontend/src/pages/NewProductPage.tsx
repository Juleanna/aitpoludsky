import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import * as catalogApi from "@/api/catalog";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type {
  Category,
  ProductChannel,
  ProductInput,
  ProductVariantInput,
  ProductVatStatus,
} from "@/types";
import { formatMoney } from "@/utils/format";

// Повноекранна сторінка створення нового товару. Повторює розкладку прототипу:
// основне / медіа / ціна та запас / варіанти / канали / SEO зліва + preview і
// прогноз маржі справа. Поки бекенд-модель Product не має всіх полів —
// записуємо лише ті, що підтримуються (name, sku, description, price, stock,
// is_active). Решта — UI-only, готова до розширення схеми пізніше.

const CHANNELS: { key: ProductChannel; emoji: string; subKey: string }[] = [
  { key: "web", emoji: "🌐", subKey: "newProduct.channels.webSub" },
  { key: "ig", emoji: "📸", subKey: "newProduct.channels.igSub" },
  { key: "google", emoji: "🔍", subKey: "newProduct.channels.googleSub" },
  { key: "pos", emoji: "💳", subKey: "newProduct.channels.posSub" },
];

const META_TITLE_MAX = 60;
const META_DESC_MAX = 160;
const MAX_IMAGES = 9;

// Опція товару: типу "Обсмажка" з набором значень ["Світла", "Темна"].
type Option = { id: string; name: string; values: string[] };

// Варіант у UI — генерується з опцій, редагується inline.
type Variant = { key: string; name: string; price: string; stock: number; sku: string };

// Декартів добуток значень опцій → список комбінацій.
function cartesianOptions(opts: Option[]): string[][] {
  const nonEmpty = opts.filter((o) => o.values.length > 0);
  if (nonEmpty.length === 0) return [];
  let combos: string[][] = [[]];
  for (const opt of nonEmpty) {
    const next: string[][] = [];
    for (const combo of combos) {
      for (const v of opt.values) next.push([...combo, v]);
    }
    combos = next;
  }
  return combos;
}

// Спрощена транслітерація укр/рос → лат для побудови SKU-префікса з назви.
// Тільки нижній регістр — далі все одно .toUpperCase().
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ъ: "",
};

function transliterate(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => (TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : ch))
    .join("");
}

function skuBaseFromName(name: string): string {
  const latin = transliterate(name).toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return latin.slice(0, 4) || "PROD";
}

function randomAlphanumSuffix(len: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // без I/O/1/0 — менше плутанини
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

// Згенерувати SKU, якого немає серед існуючих. Якщо 8 спроб мало —
// додаємо timestamp-шматок (практично гарантує унікальність).
function generateUniqueSku(name: string, taken: Set<string>): string {
  const base = skuBaseFromName(name);
  for (let i = 0; i < 8; i++) {
    const candidate = `${base}-${randomAlphanumSuffix(4)}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${randomAlphanumSuffix(4)}-${Date.now().toString(36).toUpperCase().slice(-3)}`;
}

// Згенерувати EAN-13: 12 випадкових цифр + контрольна (алгоритм GS1).
function generateEan13(): string {
  let digits = "";
  for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(digits[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + check;
}

function buildVariants(opts: Option[], basePrice: string, baseSku: string): Variant[] {
  const combos = cartesianOptions(opts);
  return combos.map((combo) => {
    const key = combo.join("__");
    const skuSuffix = combo
      .map((v) =>
        v
          .trim()
          .toUpperCase()
          .replace(/[^A-ZА-ЯЁҐЄІЇ0-9]+/gi, "")
          .slice(0, 3),
      )
      .join("-");
    return {
      key,
      name: combo.join(" / "),
      price: basePrice,
      stock: 0,
      sku: baseSku ? `${baseSku}-${skuSuffix}` : skuSuffix,
    };
  });
}

export function NewProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeShop } = useShops();

  // Основне
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Список категорій магазину (shop-scoped). Підвантажується після маунту,
  // щоб підставити перший id у selectʼі. null = «без категорії».
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [brand, setBrand] = useState(activeShop?.name ?? "");
  const [producer, setProducer] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");

  // Ціна та запас
  const [price, setPrice] = useState("0");
  const [compareAt, setCompareAt] = useState("");
  const [cost, setCost] = useState("");
  const [vat, setVat] = useState<ProductVatStatus>("none");
  const [stock, setStock] = useState("10");
  const [sku, setSku] = useState("");
  // skuTouched — користувач щось ввів у SKU руками. Поки false,
  // автогенеруємо SKU з назви. Ручний ввід або кнопка «regenerate»
  // відключають авто-підставляння.
  const [skuTouched, setSkuTouched] = useState(false);
  // Набір уже зайнятих SKU (витягуємо з listProducts активного магазину),
  // щоб генерувати значення, які гарантовано унікальні.
  const [existingSkus, setExistingSkus] = useState<Set<string>>(new Set());
  const [barcode, setBarcode] = useState("");
  const [weight, setWeight] = useState("");

  // Варіанти
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<Option[]>([
    { id: "o-1", name: t("newProduct.variants.optionRoast"), values: [] },
  ]);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Медіа — File-обʼєкти перед uploadом. Реальне відправлення — після створення товару.
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Стан drag-and-drop для перевпорядкування зображень.
  // dragIndex — що тягнемо; overIndex — куди ховер (для візуальної підсвітки).
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Канали публікації
  const [channels, setChannels] = useState<Set<ProductChannel>>(new Set(["web", "ig", "pos"]));

  // SEO
  const [urlSlug, setUrlSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Помилки per-field: ключ — назва поля payload (name/sku/price/…),
  // значення — текст повідомлення. Чистяться при зміні конкретного поля.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearFieldErr(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function addTag() {
    const v = tagDraft.trim().toLowerCase();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagDraft("");
  }
  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }
  function toggleChannel(k: ProductChannel) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  // ── Варіанти: регенеруємо при зміні опцій / ціни / SKU ─────
  // Зберігаємо вже введені price/stock/sku для існуючих комбінацій по key.
  useEffect(() => {
    if (!hasVariants) {
      setVariants([]);
      return;
    }
    setVariants((prev) => {
      const byKey = new Map(prev.map((v) => [v.key, v]));
      return buildVariants(options, price, sku).map((v) => {
        const existing = byKey.get(v.key);
        return existing ? { ...v, price: existing.price, stock: existing.stock, sku: existing.sku } : v;
      });
    });
  }, [hasVariants, options, price, sku]);

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { id: `o-${Date.now()}`, name: t("newProduct.variants.addOption"), values: [] },
    ]);
  }
  function renameOption(id: string, nextName: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, name: nextName } : o)));
  }
  function addOptionValue(id: string, value: string) {
    const v = value.trim();
    if (!v) return;
    setOptions((prev) =>
      prev.map((o) => (o.id === id && !o.values.includes(v) ? { ...o, values: [...o.values, v] } : o)),
    );
  }
  function removeOptionValue(id: string, value: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, values: o.values.filter((x) => x !== value) } : o)));
  }
  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }
  function editVariant(key: string, patch: Partial<Variant>) {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  // ── Медіа: файли + previews ────────────────────────────
  function addFiles(files: FileList | File[]) {
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (newFiles.length === 0) return;
    const room = MAX_IMAGES - mediaFiles.length;
    const toAdd = newFiles.slice(0, Math.max(0, room));
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setMediaFiles((prev) => [...prev, ...toAdd]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
  }
  function removeFileAt(index: number) {
    const url = mediaPreviews[index];
    if (url) URL.revokeObjectURL(url);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  }
  // Переставляє елемент із індексу from у target у двох паралельних масивах.
  function moveFile(from: number, to: number) {
    if (from === to) return;
    setMediaFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setMediaPreviews((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }
  // Прибираємо object URLs при розмонтуванні.
  useEffect(() => {
    return () => {
      mediaPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Завантажуємо існуючі SKU магазину — для перевірки унікальності при
  // автогенерації. Витягуємо лише sku-поля (окремого light-endpoint немає —
  // listProducts віддає все, але для форми нового товару це прийнятно).
  useEffect(() => {
    if (!activeShop) return;
    let cancelled = false;
    void catalogApi
      .listProducts(activeShop.slug)
      .then((rows) => {
        if (cancelled) return;
        setExistingSkus(new Set(rows.map((r) => r.sku).filter(Boolean)));
      })
      .catch(() => {
        if (cancelled) return;
        setExistingSkus(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [activeShop?.slug]);

  // Авто-підставляння SKU при зміні назви, поки користувач не редагував поле.
  useEffect(() => {
    if (skuTouched) return;
    if (!name.trim()) {
      setSku("");
      return;
    }
    setSku(generateUniqueSku(name, existingSkus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, existingSkus]);

  // Підвантажуємо категорії поточного магазину. При перемиканні магазину —
  // скидаємо вибраний id (щоб не лишився id з іншого магазину).
  useEffect(() => {
    if (!activeShop) return;
    let cancelled = false;
    void catalogApi
      .listCategories(activeShop.slug)
      .then((rows) => {
        if (cancelled) return;
        setCategories(rows);
        setCategory((prev) => {
          if (prev && rows.some((r) => r.id === prev)) return prev;
          return rows.length > 0 ? rows[0].id : null;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeShop?.slug]);

  const selectedCategoryName = useMemo(
    () => categories.find((c) => c.id === category)?.name ?? "",
    [categories, category],
  );

  // Розрахунки для правої колонки.
  const margin = useMemo(() => {
    const p = Number(price) || 0;
    const c = Number(cost) || 0;
    if (p <= 0) return { pct: 0, ok: false };
    const pct = Math.round(((p - c) / p) * 100);
    return { pct, ok: pct > 0 };
  }, [price, cost]);

  // Оцінка, на скільки днів вистачить запасу (дуже умовно — mock).
  const stockDays = useMemo(() => {
    const s = Number(stock) || 0;
    return s > 0 ? Math.max(1, Math.round(s * 0.3)) : 0;
  }, [stock]);

  async function save(activate: boolean) {
    if (!activeShop) return;

    // ── Клієнтська валідація перед відправкою ─────────────────
    // Зупиняє запит, якщо очевидно обов'язкові поля пусті або некоректні.
    // Бекенд має свою валідацію, але краще показати помилки одразу.
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("newProduct.errors.required");
    if (!sku.trim()) errs.sku = t("newProduct.errors.required");
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      errs.price = t("newProduct.errors.priceInvalid");
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(t("newProduct.errors.fixFields"));
      // Прокручуємо до першого поля з помилкою (плавно).
      requestAnimationFrame(() => {
        document.querySelector(".has-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const variantsPayload: ProductVariantInput[] = hasVariants
        ? variants.map((v, i) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            position: i,
          }))
        : [];
      const payload: ProductInput = {
        name,
        sku,
        description,
        category,
        brand,
        producer,
        tags,
        price,
        compare_at_price: compareAt ? compareAt : null,
        cost: cost ? cost : null,
        vat_status: vat,
        stock: Number(stock) || 0,
        barcode,
        weight_grams: weight ? Number(weight) : null,
        is_active: activate,
        url_slug: urlSlug,
        meta_title: metaTitle,
        meta_description: metaDesc,
        channels: Array.from(channels),
        variants: variantsPayload,
      };
      const created = await catalogApi.createProduct(activeShop.slug, payload);
      // Послідовно аплоадимо зображення, щоб зберегти порядок на сервері.
      for (const file of mediaFiles) {
        try {
          await catalogApi.uploadProductImage(activeShop.slug, created.id, file);
        } catch {
          // Не блокуємо redirect — показуємо alert і продовжуємо.
          window.alert(`${file.name}: ${t("newProduct.media.uploadFailed")}`);
        }
      }
      navigate("/catalog");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[] | string> | null;
        if (body && typeof body === "object") {
          // Розкладаємо помилки бекенду по полях (key == назва поля payload).
          const mapped: Record<string, string> = {};
          for (const [key, value] of Object.entries(body)) {
            const msg = Array.isArray(value) ? value[0] : String(value);
            mapped[key] = msg;
          }
          setFieldErrors(mapped);
          setError(t("newProduct.errors.fixFields"));
          requestAnimationFrame(() => {
            document.querySelector(".has-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
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

  if (!activeShop) {
    return (
      <div className="content">
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <p>{t("shops.firstNeedShop")}</p>
          <Link to="/shops" className="btn accent">
            {t("shops.goShops")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content" style={{ maxWidth: 1320 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button
          type="button"
          className="btn ghost icon"
          onClick={() => navigate("/catalog")}
          aria-label={t("common.back")}
        >
          <Icon name="arrow_left" size={14} />
        </button>
        <Link
          to="/catalog"
          style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none" }}
        >
          {t("nav.catalog")}
        </Link>
        <span style={{ color: "var(--text-3)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--text)" }}>{t("newProduct.breadcrumb")}</span>
      </div>

      <div className="page-head" style={{ paddingBottom: 20 }}>
        <div>
          <h1 className="page-title">
            {t("newProduct.titleBefore")} <em>{t("newProduct.titleAccent")}</em>
          </h1>
          <p className="page-sub">{t("newProduct.subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn ghost" onClick={() => navigate("/catalog")} disabled={busy}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn" onClick={() => void save(false)} disabled={busy}>
            {t("newProduct.draft")}
          </button>
          <button
            type="button"
            className="btn accent"
            onClick={() => void save(true)}
            disabled={busy || !name || !sku}
          >
            {busy ? t("common.saving") : t("newProduct.publish")}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>
          {error}
        </div>
      )}

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void save(true);
        }}
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24 }}
      >
        {/* ── Ліва колонка ──────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Основне */}
          <section className="np-card">
            <h3 className="np-section-title">{t("newProduct.sections.basic")}</h3>
            <Field label={t("newProduct.fields.name")} required error={fieldErrors.name}>
              <input
                className="onb-input"
                value={name}
                required
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldErr("name");
                }}
              />
            </Field>
            <Field label={t("newProduct.fields.description")}>
              <textarea
                className="onb-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label={t("newProduct.fields.category")}>
                <select
                  className="onb-input"
                  value={category ?? ""}
                  onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t("newProduct.fields.categoryNone")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("newProduct.fields.brand")}>
                <input className="onb-input" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </Field>
              <Field label={t("newProduct.fields.producer")}>
                <input
                  className="onb-input"
                  value={producer}
                  onChange={(e) => setProducer(e.target.value)}
                />
              </Field>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span>{t("newProduct.fields.categoryHint")}</span>
              <Link to="/categories" style={{ color: "var(--accent)", textDecoration: "none" }}>
                {t("newProduct.fields.categoryManage")} →
              </Link>
            </div>

            <Field label={t("newProduct.fields.tags")}>
              <div className="np-tags">
                {tags.map((tag) => (
                  <span key={tag} className="np-tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label="remove">
                      ×
                    </button>
                  </span>
                ))}
                <input
                  className="np-tag-input"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                      setTags(tags.slice(0, -1));
                    }
                  }}
                  onBlur={addTag}
                  placeholder={t("newProduct.fields.tagPlaceholder")}
                />
              </div>
            </Field>
          </section>

          {/* Медіа — реальний file upload, preview через object URL.
              Файли завантажуються на бекенд після створення товару. */}
          <section className="np-card">
            <h3 className="np-section-title">{t("newProduct.sections.media")}</h3>
            <div className="np-sub">{t("newProduct.media.hint")}</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="np-media-grid">
              {mediaPreviews.map((url, i) => (
                <div
                  key={url}
                  className={`np-media-slot${dragIndex === i ? " dragging" : ""}${overIndex === i && dragIndex !== null && dragIndex !== i ? " drag-over" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(i);
                    e.dataTransfer.effectAllowed = "move";
                    // Firefox не починає drag без setData.
                    e.dataTransfer.setData("text/plain", String(i));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overIndex !== i) setOverIndex(i);
                  }}
                  onDragLeave={() => {
                    if (overIndex === i) setOverIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) moveFile(dragIndex, i);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                >
                  {i === 0 && <span className="np-media-badge">{t("newProduct.media.primary")}</span>}
                  <img
                    src={url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    draggable={false}
                  />
                  <button
                    type="button"
                    className="np-media-remove"
                    onClick={() => removeFileAt(i)}
                    aria-label={t("common.delete")}
                  >
                    ×
                  </button>
                </div>
              ))}
              {mediaFiles.length < MAX_IMAGES && (
                <button
                  type="button"
                  className="np-media-add"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="plus" size={18} />
                  <span style={{ fontSize: 12 }}>{t("newProduct.media.add")}</span>
                </button>
              )}
            </div>
          </section>

          {/* Ціна та запас */}
          <section className="np-card">
            <h3 className="np-section-title">{t("newProduct.sections.pricing")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <Field label={t("newProduct.fields.price")} required error={fieldErrors.price}>
                <input
                  className="onb-input mono"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  required
                  onChange={(e) => {
                    setPrice(e.target.value);
                    clearFieldErr("price");
                  }}
                />
              </Field>
              <Field label={t("newProduct.fields.compareAt")} hint={t("newProduct.fields.compareAtHint")}>
                <input
                  className="onb-input mono"
                  type="number"
                  step="0.01"
                  min="0"
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                />
              </Field>
              <Field label={t("newProduct.fields.cost")} hint={t("newProduct.fields.costHint")}>
                <input
                  className="onb-input mono"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </Field>
              <Field label={t("newProduct.fields.vat")}>
                <select
                  className="onb-input"
                  value={vat}
                  onChange={(e) => setVat(e.target.value as ProductVatStatus)}
                >
                  <option value="none">{t("newProduct.vat.none")}</option>
                  <option value="20">{t("newProduct.vat.v20")}</option>
                  <option value="7">{t("newProduct.vat.v7")}</option>
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
              <Field
                label={t("newProduct.fields.stock")}
                hint={stockDays > 0 ? `~${stockDays} ${t("newProduct.fields.stockDaysUnit")}` : undefined}
              >
                <input
                  className="onb-input mono"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </Field>
              <Field
                label={t("newProduct.fields.sku")}
                required
                error={fieldErrors.sku}
                hint={
                  sku && existingSkus.has(sku)
                    ? t("newProduct.fields.skuTaken")
                    : !skuTouched && sku
                      ? t("newProduct.fields.skuAuto")
                      : undefined
                }
              >
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className="onb-input mono"
                    value={sku}
                    required
                    onChange={(e) => {
                      setSku(e.target.value.toUpperCase());
                      setSkuTouched(true);
                      clearFieldErr("sku");
                    }}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button
                    type="button"
                    className="btn ghost icon"
                    onClick={() => {
                      setSku(generateUniqueSku(name, existingSkus));
                      setSkuTouched(true);
                    }}
                    aria-label={t("newProduct.fields.skuGenerate")}
                    title={t("newProduct.fields.skuGenerate")}
                  >
                    <Icon name="sparkle" size={14} />
                  </button>
                </div>
              </Field>
              <Field label={t("newProduct.fields.barcode")}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className="onb-input mono"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button
                    type="button"
                    className="btn ghost icon"
                    onClick={() => setBarcode(generateEan13())}
                    aria-label={t("newProduct.fields.barcodeGenerate")}
                    title={t("newProduct.fields.barcodeGenerate")}
                  >
                    <Icon name="sparkle" size={14} />
                  </button>
                </div>
              </Field>
              <Field label={t("newProduct.fields.weight")}>
                <input
                  className="onb-input mono"
                  type="number"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Варіанти (toggle) */}
          <section className="np-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="np-section-title" style={{ margin: 0 }}>
                {t("newProduct.sections.variants")}
              </h3>
              <button
                type="button"
                className={`np-toggle ${hasVariants ? "on" : ""}`}
                onClick={() => setHasVariants((v) => !v)}
                aria-label="toggle variants"
              >
                <span />
              </button>
            </div>
            <div className="np-sub">{t("newProduct.variants.hint")}</div>
            {hasVariants && (
              <>
                {/* Редактор опцій: кожна опція — ім'я + набір значень-chip */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  {options.map((opt) => (
                    <OptionRow
                      key={opt.id}
                      option={opt}
                      onRename={(n) => renameOption(opt.id, n)}
                      onAddValue={(v) => addOptionValue(opt.id, v)}
                      onRemoveValue={(v) => removeOptionValue(opt.id, v)}
                      onRemove={() => removeOption(opt.id)}
                    />
                  ))}
                  <div>
                    <button type="button" className="btn ghost" onClick={addOption}>
                      <Icon name="plus" size={12} /> {t("newProduct.variants.addOption")}
                    </button>
                  </div>
                </div>

                {/* Таблиця згенерованих варіантів з inline-edit */}
                <table className="tbl" style={{ marginTop: 14 }}>
                  <thead>
                    <tr>
                      <th>{t("newProduct.variants.colVariant")}</th>
                      <th className="num">{t("newProduct.variants.colPrice")}</th>
                      <th className="num">{t("newProduct.variants.colStock")}</th>
                      <th>{t("newProduct.variants.colSku")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ color: "var(--text-3)", padding: 20, textAlign: "center" }}>
                          {t("newProduct.variants.empty")}
                        </td>
                      </tr>
                    )}
                    {variants.map((v) => (
                      <tr key={v.key}>
                        <td>{v.name}</td>
                        <td className="num">
                          <input
                            className="inline-edit num mono"
                            type="number"
                            step="0.01"
                            min="0"
                            value={v.price}
                            onChange={(e) => editVariant(v.key, { price: e.target.value })}
                          />
                        </td>
                        <td className="num">
                          <input
                            className="inline-edit num mono"
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => editVariant(v.key, { stock: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td>
                          <input
                            className="inline-edit mono"
                            value={v.sku}
                            onChange={(e) => editVariant(v.key, { sku: e.target.value.toUpperCase() })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          {/* Канали */}
          <section className="np-card">
            <h3 className="np-section-title">{t("newProduct.sections.channels")}</h3>
            <div className="publish-channels">
              {CHANNELS.map((c) => {
                const on = channels.has(c.key);
                return (
                  <div
                    key={c.key}
                    className={`pub-channel ${on ? "active" : ""}`}
                    onClick={() => toggleChannel(c.key)}
                  >
                    {on && (
                      <span className="check">
                        <Icon name="check" size={12} />
                      </span>
                    )}
                    <div className="pub-channel-emoji">{c.emoji}</div>
                    <div className="pub-channel-label">{t(`catalog.channels.${c.key}`)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{t(c.subKey)}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SEO */}
          <section className="np-card">
            <h3 className="np-section-title">{t("newProduct.sections.seo")}</h3>
            <div className="np-sub">{t("newProduct.seo.hint")}</div>
            <Field label={t("newProduct.seo.url")}>
              <div className="onb-input-with-suffix">
                <input
                  value={urlSlug}
                  onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="my-product"
                />
                <span>.html</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                {activeShop.slug}.aitpoludsky.shop/p/{urlSlug || "..."}
              </div>
            </Field>
            <Field
              label={t("newProduct.seo.metaTitle")}
              hint={`${metaTitle.length} / ${META_TITLE_MAX} ${t("newProduct.seo.chars")}`}
            >
              <input
                className="onb-input"
                value={metaTitle}
                maxLength={META_TITLE_MAX}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </Field>
            <Field
              label={t("newProduct.seo.metaDesc")}
              hint={`${metaDesc.length} / ${META_DESC_MAX} ${t("newProduct.seo.chars")}`}
            >
              <textarea
                className="onb-input"
                rows={2}
                value={metaDesc}
                maxLength={META_DESC_MAX}
                onChange={(e) => setMetaDesc(e.target.value)}
              />
            </Field>
          </section>
        </div>

        {/* ── Права колонка ─────────────────────────────── */}
        {/* Обгортка-sticky тримає Preview і Маржу разом при скролі,
            щоб вони не наїжджали одна на одну. */}
        <aside>
          <div
            style={{
              position: "sticky",
              top: 80,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
            }}
          >
          <section className="np-card">
            <h3 className="np-section-title">{t("newProduct.preview.title")}</h3>
            <div className="inline-preview" style={{ maxWidth: "none", aspectRatio: "3/4" }}>
              <div className="product-thumb" data-tone="1" style={{ aspectRatio: "1" }} />
              <div style={{ padding: 14 }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {(selectedCategoryName || t("newProduct.fields.categoryNone")).toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, marginTop: 4 }}>
                  {name || t("newProduct.preview.placeholderName")}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                  <span className="serif" style={{ fontSize: 22 }}>
                    {formatMoney(price, activeShop.currency)}
                  </span>
                  {compareAt && Number(compareAt) > Number(price) && (
                    <span
                      className="serif"
                      style={{ fontSize: 14, color: "var(--text-3)", textDecoration: "line-through" }}
                    >
                      {formatMoney(compareAt, activeShop.currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="np-card">
            <h3 className="np-section-title">{t("newProduct.margin.title")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <Row label={t("newProduct.margin.price")} value={formatMoney(price, activeShop.currency)} />
              <Row
                label={t("newProduct.margin.cost")}
                value={cost ? `~${formatMoney(cost, activeShop.currency)}` : "—"}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px dashed var(--line)",
                  paddingTop: 10,
                }}
              >
                <span>{t("newProduct.margin.margin")}</span>
                <span className={`chip ${margin.ok ? "ok" : "err"}`}>{margin.pct}%</span>
              </div>
            </div>
          </section>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  // Клас .has-error застосовує червону рамку до вкладених .onb-input.
  // error має пріоритет над hint — одночасно не показуємо обидва.
  return (
    <div className={error ? "has-error" : undefined} style={{ marginBottom: 12 }}>
      <label className="onb-label">
        {label}
        {required && <span className="req" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <div className="field-err">{error}</div>
      ) : (
        hint && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span className="mono">{value}</span>
    </div>
  );
}

// Редактор однієї опції: ім'я + chip-values + кнопка видалення.
function OptionRow({
  option,
  onRename,
  onAddValue,
  onRemoveValue,
  onRemove,
}: {
  option: Option;
  onRename: (name: string) => void;
  onAddValue: (value: string) => void;
  onRemoveValue: (value: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 28px", gap: 10, alignItems: "flex-start" }}>
      <input
        className="onb-input"
        value={option.name}
        onChange={(e) => onRename(e.target.value)}
        style={{ padding: "6px 10px", fontSize: 13 }}
      />
      <div className="np-tags" style={{ minHeight: 36 }}>
        {option.values.map((v) => (
          <span key={v} className="np-tag">
            {v}
            <button type="button" onClick={() => onRemoveValue(v)} aria-label="remove">
              ×
            </button>
          </span>
        ))}
        <input
          className="np-tag-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (draft.trim()) {
                onAddValue(draft);
                setDraft("");
              }
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              onAddValue(draft);
              setDraft("");
            }
          }}
          placeholder="…"
        />
      </div>
      <button
        type="button"
        className="btn ghost icon"
        onClick={onRemove}
        aria-label="remove option"
        title="remove"
      >
        ×
      </button>
    </div>
  );
}
