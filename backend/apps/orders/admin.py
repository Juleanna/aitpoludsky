from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("line_total",)
    autocomplete_fields = ("product",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("number", "shop", "customer_name", "status", "channel", "total", "created_at")
    list_filter = ("shop", "status", "channel")
    search_fields = ("number", "customer_name", "customer_phone", "customer_email")
    autocomplete_fields = ("shop",)
    readonly_fields = ("number", "subtotal", "total", "created_at", "updated_at")
    inlines = [OrderItemInline]
