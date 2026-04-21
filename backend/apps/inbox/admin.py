from django.contrib import admin

from .models import Message, Thread


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "shop", "channel", "subject", "customer", "unread", "updated_at")
    list_filter = ("shop", "channel", "unread")
    search_fields = ("subject", "customer__name", "external_id")
    autocomplete_fields = ("shop", "customer")
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("thread", "direction", "author_name", "created_at")
    list_filter = ("direction",)
    search_fields = ("body", "author_name")
