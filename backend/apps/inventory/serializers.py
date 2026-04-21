from django.db import transaction
from django.db.models import F
from rest_framework import serializers

from apps.catalog.models import Product

from .models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product", queryset=Product.objects.all(), write_only=True
    )
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    created_by_email = serializers.CharField(source="created_by.email", read_only=True, default="")

    class Meta:
        model = StockMovement
        fields = (
            "id",
            "product_id",
            "product",
            "product_name",
            "product_sku",
            "kind",
            "delta",
            "balance_after",
            "note",
            "created_at",
            "created_by_email",
        )
        read_only_fields = ("id", "product", "balance_after", "created_at", "created_by_email")

    def validate(self, attrs):
        request = self.context["request"]
        shop = request.shop
        product: Product = attrs["product"]
        if product.shop_id != shop.id:
            raise serializers.ValidationError({"product_id": "Товар не належить поточному магазину."})
        delta = attrs["delta"]
        if delta == 0:
            raise serializers.ValidationError({"delta": "Зміна не може бути нульовою."})
        projected = product.stock + delta
        if projected < 0:
            raise serializers.ValidationError(
                {"delta": f"Залишок не може стати відʼємним (зараз {product.stock}, спроба {delta})."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        product: Product = validated_data["product"]
        delta: int = validated_data["delta"]
        # Atomic stock update using F() to avoid lost-updates under concurrent moves.
        Product.objects.filter(pk=product.pk).update(stock=F("stock") + delta)
        product.refresh_from_db(fields=["stock"])
        request = self.context["request"]
        return StockMovement.objects.create(
            shop=request.shop,
            balance_after=product.stock,
            created_by=request.user if request.user.is_authenticated else None,
            **validated_data,
        )
