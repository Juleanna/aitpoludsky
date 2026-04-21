from rest_framework import serializers

from apps.shops.constants import LANGUAGE_CODES

from .models import Product

_TRANSLATABLE_FIELDS = {"name", "description"}


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "description",
            "price",
            "stock",
            "is_active",
            "translations",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_sku(self, value):
        shop = self.context["request"].shop
        qs = Product.objects.filter(shop=shop, sku=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("SKU вже існує в цьому магазині.")
        return value

    def validate_translations(self, value):
        if value in (None, ""):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("Поле translations має бути обʼєктом.")
        shop = self.context["request"].shop
        allowed_langs = set(shop.languages or []) | {shop.default_language}
        cleaned: dict = {}
        for lang, payload in value.items():
            if lang not in LANGUAGE_CODES:
                raise serializers.ValidationError(f"Невідомий код мови '{lang}'.")
            if lang not in allowed_langs:
                raise serializers.ValidationError(
                    f"Мова '{lang}' не налаштована для цього магазину. "
                    "Додайте її у налаштуваннях магазину."
                )
            if not isinstance(payload, dict):
                raise serializers.ValidationError(
                    f"translations['{lang}'] має бути обʼєктом з полями name/description."
                )
            lang_entry: dict = {}
            for key, v in payload.items():
                if key not in _TRANSLATABLE_FIELDS:
                    raise serializers.ValidationError(
                        f"Невідоме поле перекладу '{key}'. Доступні: {sorted(_TRANSLATABLE_FIELDS)}."
                    )
                if v is None:
                    continue
                if not isinstance(v, str):
                    raise serializers.ValidationError(
                        f"translations['{lang}']['{key}'] має бути рядком."
                    )
                lang_entry[key] = v
            if lang_entry:
                cleaned[lang] = lang_entry
        return cleaned
