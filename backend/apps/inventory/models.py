from django.conf import settings
from django.db import models

from apps.catalog.models import Product
from apps.shops.models import Shop


class StockMovement(models.Model):
    class Kind(models.TextChoices):
        RECEIPT = "receipt", "Прихід"
        ISSUE = "issue", "Видача"
        ADJUSTMENT = "adjustment", "Корекція"
        WRITEOFF = "writeoff", "Списання"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="stock_movements")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="stock_movements")
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.RECEIPT)
    delta = models.IntegerField(help_text="Зміна залишку: додатне для приходу, відʼємне для видачі.")
    balance_after = models.IntegerField(help_text="Залишок товару після застосування руху.")
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("shop", "-created_at")),
            models.Index(fields=("product",)),
        ]

    def __str__(self):
        sign = "+" if self.delta >= 0 else ""
        return f"{self.product.sku} {sign}{self.delta} ({self.kind})"
