from django.contrib import admin

from .models import Category, Product, ProductImage, ProductVariant


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "shop", "position", "created_at")
    list_filter = ("shop",)
    search_fields = ("name", "shop__name", "shop__slug")
    autocomplete_fields = ("shop",)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = ("image", "position", "is_primary", "alt")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "shop",
        "category",
        "price",
        "stock",
        "is_active",
        "updated_at",
    )
    list_filter = ("shop", "category", "vat_status", "is_active")
    search_fields = ("name", "sku", "barcode", "brand", "producer")
    autocomplete_fields = ("shop",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [ProductImageInline, ProductVariantInline]
    fieldsets = (
        (
            "Основне",
            {"fields": ("shop", "sku", "name", "description", "category", "brand", "producer", "tags")},
        ),
        (
            "Ціна та фінанси",
            {"fields": ("price", "compare_at_price", "cost", "vat_status")},
        ),
        (
            "Склад",
            {"fields": ("stock", "barcode", "weight_grams")},
        ),
        (
            "Видимість і переклади",
            {"fields": ("is_active", "translations")},
        ),
        (
            "SEO",
            {"fields": ("url_slug", "meta_title", "meta_description")},
        ),
        (
            "Канали",
            {"fields": ("channels",)},
        ),
        (
            "Дати",
            {"fields": ("created_at", "updated_at")},
        ),
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "product", "price", "stock", "position")
    search_fields = ("name", "sku", "product__name")
    autocomplete_fields = ("product",)
