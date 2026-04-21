from django.db import models

from apps.shops.models import Shop


class Customer(models.Model):
    class Tier(models.TextChoices):
        BRONZE = "bronze", "Bronze"
        SILVER = "silver", "Silver"
        GOLD = "gold", "Gold"
        PLATINUM = "platinum", "Platinum"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="customers")
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    tier = models.CharField(max_length=10, choices=Tier.choices, default=Tier.BRONZE)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("shop", "email")),
            models.Index(fields=("shop", "phone")),
        ]

    def __str__(self):
        return self.name or self.email or self.phone or f"Customer #{self.pk}"
