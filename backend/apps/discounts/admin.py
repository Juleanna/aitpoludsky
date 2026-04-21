from django.contrib import admin

from .models import Discount


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ("code", "shop", "kind", "value", "is_active", "uses_count", "max_uses")
    list_filter = ("shop", "kind", "is_active")
    search_fields = ("code", "name")
    autocomplete_fields = ("shop",)
    readonly_fields = ("uses_count", "created_at", "updated_at")
