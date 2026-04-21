from django.contrib import admin

from .models import Shop, ShopMembership


class ShopMembershipInline(admin.TabularInline):
    model = ShopMembership
    extra = 0
    autocomplete_fields = ("user",)


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "owner", "currency", "created_at")
    search_fields = ("name", "slug", "owner__email")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ShopMembershipInline]


@admin.register(ShopMembership)
class ShopMembershipAdmin(admin.ModelAdmin):
    list_display = ("shop", "user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("shop__slug", "user__email")
    autocomplete_fields = ("shop", "user")
