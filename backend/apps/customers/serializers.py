from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    orders_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    last_order_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Customer
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "tier",
            "note",
            "orders_count",
            "total_spent",
            "last_order_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "orders_count", "total_spent", "last_order_at", "created_at", "updated_at")
