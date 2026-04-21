from django.conf import settings
from django.conf.urls.static import static
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

# У DEBUG-режимі Django віддає файли з MEDIA_ROOT. У prod це робить nginx.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
