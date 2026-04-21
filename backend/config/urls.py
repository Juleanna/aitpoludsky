from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/shops/", include("apps.shops.urls")),
    path("api/catalog/", include("apps.catalog.urls")),
    path("api/customers/", include("apps.customers.urls")),
    path("api/discounts/", include("apps.discounts.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/inventory/", include("apps.inventory.urls")),
    path("api/dashboard/", include("apps.dashboard.urls")),
    path("api/public/", include("apps.storefront.urls")),
    path("api/inbox/", include("apps.inbox.urls")),
]
