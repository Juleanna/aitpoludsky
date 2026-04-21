from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.catalog.models import Product
from apps.customers.models import Customer

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.all(),
        write_only=True,
    )

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_id",
            "product",
            "product_name",
            "product_sku",
            "unit_price",
            "quantity",
            "line_total",
        )
        read_only_fields = ("id", "product", "product_name", "product_sku", "unit_price", "line_total")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        source="customer",
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "number",
            "customer",
            "customer_id",
            "customer_name",
            "customer_phone",
            "customer_email",
            "status",
            "channel",
            "subtotal",
            "total",
            "note",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "number", "customer", "subtotal", "total", "created_at", "updated_at")

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Замовлення мусить містити хоча б одну позицію.")
        shop = self.context["request"].shop
        for item in items:
            product = item["product"]
            if product.shop_id != shop.id:
                raise serializers.ValidationError("Товар не належить поточному магазину.")
        return items

    def validate(self, attrs):
        customer = attrs.get("customer")
        if customer is not None:
            shop = self.context["request"].shop
            if customer.shop_id != shop.id:
                raise serializers.ValidationError({"customer_id": "Клієнт не належить поточному магазину."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)
        self._materialise_items(order, items_data)
        order.recompute_totals()
        order.save(update_fields=["subtotal", "total"])
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            self._materialise_items(instance, items_data)
            instance.recompute_totals()
            instance.save(update_fields=["subtotal", "total"])
        return instance

    @staticmethod
    def _materialise_items(order, items_data):
        for item in items_data:
            product: Product = item["product"]
            quantity = item["quantity"]
            unit_price = product.price
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_sku=product.sku,
                unit_price=unit_price,
                quantity=quantity,
                line_total=(unit_price or Decimal("0")) * quantity,
            )
