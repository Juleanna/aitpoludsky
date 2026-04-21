from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "shop", "price", "stock", "is_active", "updated_at")
    list_filter = ("shop", "is_active")
    search_fields = ("name", "sku")
    autocomplete_fields = ("shop",)
    readonly_fields = ("created_at", "updated_at")
