from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from apps.catalog.permissions import IsShopMember
from apps.customers.models import Customer
from apps.orders.models import Order

LOW_STOCK_THRESHOLD = 5
SPARKLINE_DAYS = 14


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsShopMember]

    def get(self, request):
        shop = request.shop
        now = timezone.now()
        start_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_week = start_day - timedelta(days=6)
        start_month = start_day - timedelta(days=29)
        sparkline_start = start_day - timedelta(days=SPARKLINE_DAYS - 1)

        base_orders = Order.objects.filter(shop=shop).exclude(status=Order.Status.CANCELLED)

        def bucket(qs_since):
            agg = qs_since.aggregate(
                count=Count("id"),
                total=Coalesce(Sum("total"), Decimal("0.00")),
            )
            return {"count": agg["count"], "total": str(agg["total"])}

        orders = {
            "today": bucket(base_orders.filter(created_at__gte=start_day)),
            "week": bucket(base_orders.filter(created_at__gte=start_week)),
            "month": bucket(base_orders.filter(created_at__gte=start_month)),
            "all": bucket(base_orders),
        }

        products_qs = Product.objects.filter(shop=shop)
        products = {
            "total": products_qs.count(),
            "active": products_qs.filter(is_active=True).count(),
            "low_stock": products_qs.filter(stock__lt=LOW_STOCK_THRESHOLD, stock__gt=0).count(),
            "out_of_stock": products_qs.filter(stock=0).count(),
        }

        customers = {"total": Customer.objects.filter(shop=shop).count()}

        sales_by_day = (
            base_orders.filter(created_at__gte=sparkline_start)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Coalesce(Sum("total"), Decimal("0.00")), count=Count("id"))
            .order_by("day")
        )
        totals_by_day = {row["day"]: row for row in sales_by_day}
        sparkline = []
        for i in range(SPARKLINE_DAYS):
            day = (sparkline_start + timedelta(days=i)).date()
            row = totals_by_day.get(day)
            sparkline.append(
                {
                    "date": day.isoformat(),
                    "total": str(row["total"]) if row else "0.00",
                    "count": row["count"] if row else 0,
                }
            )

        recent_orders = list(
            base_orders.order_by("-created_at")[:5].values(
                "id", "number", "customer_name", "status", "channel", "total", "created_at"
            )
        )
        for row in recent_orders:
            row["total"] = str(row["total"])
            row["created_at"] = row["created_at"].isoformat()

        return Response(
            {
                "orders": orders,
                "products": products,
                "customers": customers,
                "sales_14d": sparkline,
                "recent_orders": recent_orders,
                "currency": shop.currency,
            }
        )
