from django.conf import settings
from django.db import models

from apps.customers.models import Customer
from apps.shops.models import Shop


class Thread(models.Model):
    class Channel(models.TextChoices):
        WEB = "web", "Web"
        INSTAGRAM = "ig", "Instagram"
        TELEGRAM = "tg", "Telegram"
        VIBER = "viber", "Viber"
        MANUAL = "manual", "Manual"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="inbox_threads")
    customer = models.ForeignKey(
        Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name="inbox_threads"
    )
    channel = models.CharField(max_length=8, choices=Channel.choices, default=Channel.WEB)
    subject = models.CharField(max_length=200, blank=True)
    external_id = models.CharField(max_length=120, blank=True, help_text="ID у зовнішньому месенджері.")
    unread = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=("shop", "-updated_at")),
            models.Index(fields=("shop", "channel")),
        ]

    def __str__(self):
        return f"{self.get_channel_display()} · {self.subject or self.pk}"


class Message(models.Model):
    class Direction(models.TextChoices):
        INBOUND = "in", "Inbound"
        OUTBOUND = "out", "Outbound"

    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name="messages")
    direction = models.CharField(max_length=3, choices=Direction.choices)
    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    author_name = models.CharField(max_length=120, blank=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [models.Index(fields=("thread", "created_at"))]

    def __str__(self):
        return f"{self.direction} · {self.body[:30]}"
