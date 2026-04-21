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

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: string; // DRF serialises DecimalField as string to preserve precision
  stock: number;
  is_active: boolean;
  translations: ProductTranslations;
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  sku: string;
  name: string;
  description?: string;
  price: string;
  stock: number;
  is_active?: boolean;
  translations?: ProductTranslations;
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
