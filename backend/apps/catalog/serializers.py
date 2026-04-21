from django.db import transaction
from rest_framework import serializers

from apps.shops.constants import LANGUAGE_CODES

from .models import Product, ProductVariant

_TRANSLATABLE_FIELDS = {"name", "description"}
_CHANNEL_VALUES = {"web", "ig", "google", "pos"}


class ProductVariantSerializer(serializers.ModelSerializer):
    # id — опційний, щоб при update можна було відрізняти existing від new.
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ProductVariant
        fields = ("id", "name", "sku", "price", "stock", "position")


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = (
            "id",
            # Основне
            "sku",
            "name",
            "description",
            "category",
            "brand",
            "producer",
            "tags",
            # Ціна і фінанси
            "price",
            "compare_at_price",
            "cost",
            "vat_status",
            # Склад
            "stock",
            "barcode",
            "weight_grams",
            # Видимість і переклади
            "is_active",
            "translations",
            # SEO
            "url_slug",
            "meta_title",
            "meta_description",
            # Канали та варіанти
            "channels",
            "variants",
            # Аудит
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    # ── Валідатори окремих полів ─────────────────────────────

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

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("tags має бути списком.")
        cleaned: list[str] = []
        for tag in value:
            if not isinstance(tag, str):
                raise serializers.ValidationError("Кожен тег має бути рядком.")
            norm = tag.strip().lower()
            if norm and norm not in cleaned:
                cleaned.append(norm)
        return cleaned

    def validate_channels(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("channels має бути списком.")
        cleaned: list[str] = []
        for ch in value:
            if ch not in _CHANNEL_VALUES:
                raise serializers.ValidationError(
                    f"Невідомий канал '{ch}'. Дозволені: {sorted(_CHANNEL_VALUES)}."
                )
            if ch not in cleaned:
                cleaned.append(ch)
        return cleaned

    def validate_url_slug(self, value):
        if not value:
            return value
        shop = self.context["request"].shop
        qs = Product.objects.filter(shop=shop, url_slug=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("URL-slug вже зайнятий у цьому магазині.")
        return value

    # ── Nested-варіанти: повне заміщення при update (простіше за diff) ──

    @transaction.atomic
    def create(self, validated_data):
        variants_data = validated_data.pop("variants", None) or []
        product = Product.objects.create(**validated_data)
        self._sync_variants(product, variants_data)
        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        variants_data = validated_data.pop("variants", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if variants_data is not None:
            self._sync_variants(instance, variants_data, wipe=True)
        return instance

    @staticmethod
    def _sync_variants(product: Product, variants_data: list[dict], wipe: bool = False) -> None:
        if wipe:
            product.variants.all().delete()
        for data in variants_data:
            data.pop("id", None)
            ProductVariant.objects.create(product=product, **data)
