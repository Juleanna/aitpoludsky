import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import * as dashboardApi from "@/api/dashboard";
import { Icon } from "@/components/Icon";
import { SeasonalBanner } from "@/components/SeasonalBanner";
import { Sparkline } from "@/components/Sparkline";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import { useShops } from "@/context/ShopContext";
import type { DashboardSummary, OrderChannel, OrderStatus } from "@/types";
import { currencySymbol, formatMoney, formatRelative } from "@/utils/format";

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeShop, shops } = useShops();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = activeShop?.slug ?? null;
  const name = user?.full_name || user?.email?.split("@")[0] || "";

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      setSummary(await dashboardApi.fetchSummary(slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [slug, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const statusLabel = (s: OrderStatus) => t(`orders.statuses.${s}`);
  const channelLabel = (c: OrderChannel) => t(`orders.channels.${c}`);
  const statusChipClass = (s: OrderStatus): string => {
    const map: Record<OrderStatus, string> = {
      draft: "chip",
      pending: "chip warn",
      paid: "chip ok",
      shipped: "chip accent",
      completed: "chip ok",
      cancelled: "chip err",
    };
    return map[s];
  };

  if (shops.length === 0) {
    return (
      <div className="content">
        <div className="page-head">
          <div>
            <h1 className="page-title">{t("dashboard.greeting", { name })}</h1>
            <p className="page-sub">{t("dashboard.noShops")}</p>
          </div>
          <Link to="/shops" className="btn accent">
            {t("dashboard.createShop")} →
          </Link>
        </div>
      </div>
    );
  }

  if (!activeShop) return null;

  return (
    <div className="content">
      <SeasonalBanner />
      <div className="page-head">
        <div>
          <h1 className="page-title">{t("dashboard.greeting", { name })}</h1>
          <p className="page-sub">
            {t("dashboard.activeShop", { shop: activeShop.name })}
            {summary && ` · ${t("dashboard.todayCount", { count: summary.orders.today.count })}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/orders" className="btn">
            {t("nav.orders")}
          </Link>
          <Link to="/catalog" className="btn primary">
            <Icon name="plus" size={14} /> {t("nav.catalog")}
          </Link>
        </div>
      </div>

      {error && <div className="card" style={{ padding: 14, marginBottom: 16, color: "var(--err)" }}>{error}</div>}

      {loading && !summary && (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
          {t("common.loading")}
        </div>
      )}

      {summary && (
        <>
          <div className="grid g-4" style={{ marginBottom: 24 }}>
            <StatCard
              label={t("dashboard.salesToday")}
              value={Number(summary.orders.today.total)}
              prefix={currencySymbol(summary.currency)}
              fractionDigits={2}
              data={summary.sales_14d.map((d) => Number(d.total))}
            />
            <StatCard
              label={t("dashboard.ordersToday")}
              value={summary.orders.today.count}
              data={summary.sales_14d.map((d) => d.count)}
            />
            <StatCard
              label={t("dashboard.salesMonth")}
              value={Number(summary.orders.month.total)}
              prefix={currencySymbol(summary.currency)}
              fractionDigits={2}
            />
            <StatCard label={t("dashboard.customersTotal")} value={summary.customers.total} />
          </div>

          <div className="grid g-2" style={{ marginBottom: 24 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 10 }}>
                {t("dashboard.sales14d")}
              </div>
              <Sparkline data={summary.sales_14d.map((d) => Number(d.total))} width={560} height={120} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "var(--text-3)" }}>
                <span className="mono">{summary.sales_14d[0]?.date}</span>
                <span className="mono">{summary.sales_14d[summary.sales_14d.length - 1]?.date}</span>
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", marginBottom: 10 }}>
                {t("dashboard.inventoryPanel")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Stat label={t("dashboard.products")} value={summary.products.total} />
                <Stat label={t("dashboard.active")} value={summary.products.active} />
                <Stat label={t("dashboard.lowStock")} value={summary.products.low_stock} tone={summary.products.low_stock > 0 ? "warn" : undefined} />
                <Stat label={t("dashboard.outOfStock")} value={summary.products.out_of_stock} tone={summary.products.out_of_stock > 0 ? "err" : undefined} />
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
                <Link to="/inventory" className="btn" style={{ width: "100%", justifyContent: "center" }}>
                  {t("dashboard.inventoryJournal")}
                </Link>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">{t("dashboard.recentOrders")}</h3>
              <Link to="/orders" style={{ fontSize: 12, color: "var(--accent-ink)" }}>
                {t("dashboard.allOrders")}
              </Link>
            </div>
            <table className="tbl">
              <tbody>
                {summary.recent_orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                        {o.number}
                      </div>
                      <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                    </td>
                    <td>
                      <span className="chip">{channelLabel(o.channel)}</span>
                    </td>
                    <td>
                      <span className={statusChipClass(o.status)}>
                        <span className="dot" />
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="num">{formatMoney(o.total, summary.currency)}</td>
                    <td style={{ color: "var(--text-3)", fontSize: 12 }}>{formatRelative(o.created_at)}</td>
                  </tr>
                ))}
                {summary.recent_orders.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-3)", padding: 40 }}>
                      {t("dashboard.noOrders")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "err" }) {
  const color = tone === "err" ? "var(--err)" : tone === "warn" ? "var(--warn)" : "var(--text)";
  return (
    <div>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em" }}>
        {label.toUpperCase()}
      </div>
      <div className="serif" style={{ fontSize: 32, lineHeight: 1, color, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
