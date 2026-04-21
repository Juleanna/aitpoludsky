from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "shop", "email", "phone", "tier", "created_at")
    list_filter = ("shop", "tier")
    search_fields = ("name", "email", "phone")
    autocomplete_fields = ("shop",)
