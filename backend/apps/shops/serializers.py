from django.db import transaction
from rest_framework import serializers

from .constants import LANGUAGE_CODES
from .models import Shop, ShopMembership


def _validate_language_list(value):
    if not isinstance(value, list):
        raise serializers.ValidationError("Має бути список кодів мов.")
    invalid = [code for code in value if code not in LANGUAGE_CODES]
    if invalid:
        raise serializers.ValidationError(f"Невідомі коди мов: {', '.join(invalid)}")
    # de-dupe while preserving order
    seen = []
    for code in value:
        if code not in seen:
            seen.append(code)
    return seen


class ShopSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            "id",
            "name",
            "slug",
            "currency",
            "default_language",
            "languages",
            "created_at",
            "role",
        )
        read_only_fields = ("id", "created_at", "role")

    def validate_languages(self, value):
        return _validate_language_list(value)

    def get_role(self, obj):
        user = self.context["request"].user
        if obj.owner_id == user.id:
            return ShopMembership.Role.OWNER
        membership = next(
            (m for m in obj.memberships.all() if m.user_id == user.id),
            None,
        )
        return membership.role if membership else None


class ShopCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ("name", "slug", "currency", "default_language", "languages")

    def validate_languages(self, value):
        return _validate_language_list(value)

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        shop = Shop.objects.create(owner=user, **validated_data)
        ShopMembership.objects.create(shop=shop, user=user, role=ShopMembership.Role.OWNER)
        return shop
