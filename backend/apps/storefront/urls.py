from django.urls import path

from .views import PublicProductListView, PublicShopView

urlpatterns = [
    path("<slug:shop_slug>/", PublicShopView.as_view(), name="public-shop"),
    path("<slug:shop_slug>/products/", PublicProductListView.as_view(), name="public-products"),
]
