from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from apps.catalog.models import Product
from apps.shops.models import Shop


class PublicShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ("name", "slug", "currency", "default_language", "languages")


class PublicProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ("id", "sku", "name", "description", "price", "translations")


def _resolve_public_shop(shop_slug: str) -> Shop:
    return get_object_or_404(Shop, slug=shop_slug)


class PublicShopView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicShopSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "shop_slug"

    def get_queryset(self):
        return Shop.objects.all()


class PublicProductListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicProductSerializer

    def get_queryset(self):
        shop = _resolve_public_shop(self.kwargs["shop_slug"])
        return Product.objects.filter(shop=shop, is_active=True, stock__gt=0).order_by("-created_at")
