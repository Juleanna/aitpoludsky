from rest_framework import serializers

from .models import Discount


class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = (
            "id",
            "code",
            "name",
            "kind",
            "value",
            "min_subtotal",
            "starts_at",
            "ends_at",
            "max_uses",
            "uses_count",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "uses_count", "created_at", "updated_at")

    def validate_code(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Код не може бути порожнім.")
        if " " in value:
            raise serializers.ValidationError("Код не може містити пробіли.")
        shop = self.context["request"].shop
        qs = Discount.objects.filter(shop=shop, code__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Промокод вже існує в цьому магазині.")
        return value


class DiscountValidationSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2)
