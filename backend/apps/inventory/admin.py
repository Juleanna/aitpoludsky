from django.contrib import admin

from .models import StockMovement


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("created_at", "shop", "product", "kind", "delta", "balance_after", "created_by")
    list_filter = ("shop", "kind")
    search_fields = ("product__name", "product__sku", "note")
    autocomplete_fields = ("shop", "product", "created_by")
    readonly_fields = ("created_at", "balance_after")
