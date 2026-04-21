from django.db import models

from apps.shops.models import Shop


class Product(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    sku = models.CharField(max_length=32)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    translations = models.JSONField(
        default=dict,
        blank=True,
        help_text='Формат: {"en": {"name": "...", "description": "..."}, "pl": {...}}',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("shop", "sku"), name="catalog_unique_sku_per_shop"),
        ]
        indexes = [
            models.Index(fields=("shop", "is_active")),
        ]

    def __str__(self):
        return f"{self.name} [{self.sku}]"
