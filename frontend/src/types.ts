export type User = {
  id: number;
  email: string;
  full_name: string;
  language: string;
  date_joined: string;
};

export type ShopRole = "owner" | "admin" | "staff" | "viewer";

export type Shop = {
  id: number;
  name: string;
  slug: string;
  currency: "UAH" | "USD" | "EUR";
  default_language: string;
  languages: string[];
  created_at: string;
  role: ShopRole | null;
};

export type Currency = Shop["currency"];

export type ProductTranslations = Record<string, { name?: string; description?: string }>;

export type ProductCategory = "coffee" | "clothes" | "cosmetics" | "handmade" | "food" | "other";
export type ProductVatStatus = "none" | "20" | "7";
export type ProductChannel = "web" | "ig" | "google" | "pos";

export type ProductVariant = {
  id: number;
  name: string;
  sku: string;
  price: string;
  stock: number;
  position: number;
};

export type ProductVariantInput = {
  id?: number;
  name: string;
  sku: string;
  price: string;
  stock: number;
  position?: number;
};

export type ProductImage = {
  id: number;
  image: string; // абсолютний URL
  position: number;
  is_primary: boolean;
  alt: string;
  created_at: string;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  // Категорія та бренд
  category: ProductCategory;
  brand: string;
  producer: string;
  tags: string[];
  // Ціна і фінанси (DRF серіалізує DecimalField як рядок, щоб зберегти точність)
  price: string;
  compare_at_price: string | null;
  cost: string | null;
  vat_status: ProductVatStatus;
  // Склад
  stock: number;
  barcode: string;
  weight_grams: number | null;
  // Видимість + переклади
  is_active: boolean;
  translations: ProductTranslations;
  // SEO
  url_slug: string;
  meta_title: string;
  meta_description: string;
  // Канали, варіанти, медіа
  channels: ProductChannel[];
  variants: ProductVariant[];
  images: ProductImage[];
  // Аудит
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  sku: string;
  name: string;
  description?: string;
  category?: ProductCategory;
  brand?: string;
  producer?: string;
  tags?: string[];
  price: string;
  compare_at_price?: string | null;
  cost?: string | null;
  vat_status?: ProductVatStatus;
  stock: number;
  barcode?: string;
  weight_grams?: number | null;
  is_active?: boolean;
  translations?: ProductTranslations;
  url_slug?: string;
  meta_title?: string;
  meta_description?: string;
  channels?: ProductChannel[];
  variants?: ProductVariantInput[];
};

export type OrderStatus = "draft" | "pending" | "paid" | "shipped" | "completed" | "cancelled";
export type OrderChannel = "online" | "pos" | "manual";

export type OrderItem = {
  id: number;
  product: number | null;
  product_name: string;
  product_sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
};

export type Order = {
  id: number;
  number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: OrderStatus;
  channel: OrderChannel;
  subtotal: string;
  discount_code: string;
  discount_amount: string;
  total: string;
  note: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type OrderItemInput = { product_id: number; quantity: number };

export type OrderInput = {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: number | null;
  status?: OrderStatus;
  channel?: OrderChannel;
  note?: string;
  items: OrderItemInput[];
  discount_code_input?: string | null;
};

export type DiscountKind = "percent" | "fixed";

export type Discount = {
  id: number;
  code: string;
  name: string;
  kind: DiscountKind;
  value: string;
  min_subtotal: string;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscountInput = {
  code: string;
  name?: string;
  kind?: DiscountKind;
  value: string;
  min_subtotal?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  max_uses?: number | null;
  is_active?: boolean;
};

export type DiscountValidateResult =
  | { valid: true; code: string; name: string; kind: DiscountKind; value: string; discount_amount: string; new_total: string }
  | { valid: false; error: string; code?: string };

export type InboxChannel = "web" | "ig" | "tg" | "viber" | "manual";

export type InboxMessage = {
  id: number;
  direction: "in" | "out";
  author_name: string;
  body: string;
  created_at: string;
};

export type InboxThread = {
  id: number;
  channel: InboxChannel;
  subject: string;
  customer: number | null;
  customer_name: string;
  unread: boolean;
  external_id: string;
  messages: InboxMessage[];
  last_message: { direction: "in" | "out"; body: string; created_at: string } | null;
  created_at: string;
  updated_at: string;
};

export type InboxThreadInput = {
  channel: InboxChannel;
  subject?: string;
  customer_id?: number | null;
  external_id?: string;
};

export type CustomerTier = "bronze" | "silver" | "gold" | "platinum";

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  note: string;
  orders_count: number;
  total_spent: string;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerInput = {
  name: string;
  email?: string;
  phone?: string;
  tier?: CustomerTier;
  note?: string;
};

export type StockMovementKind = "receipt" | "issue" | "adjustment" | "writeoff";

export type StockMovement = {
  id: number;
  product: number | null;
  product_name: string;
  product_sku: string;
  kind: StockMovementKind;
  delta: number;
  balance_after: number;
  note: string;
  created_at: string;
  created_by_email: string;
};

export type StockMovementInput = {
  product_id: number;
  kind: StockMovementKind;
  delta: number;
  note?: string;
};

export type DashboardBucket = { count: number; total: string };

export type DashboardRecentOrder = {
  id: number;
  number: string;
  customer_name: string;
  status: OrderStatus;
  channel: OrderChannel;
  total: string;
  created_at: string;
};

export type DashboardSparklinePoint = { date: string; total: string; count: number };

export type DashboardSummary = {
  orders: {
    today: DashboardBucket;
    week: DashboardBucket;
    month: DashboardBucket;
    all: DashboardBucket;
  };
  products: { total: number; active: number; low_stock: number; out_of_stock: number };
  customers: { total: number };
  sales_14d: DashboardSparklinePoint[];
  recent_orders: DashboardRecentOrder[];
  currency: Currency;
};
