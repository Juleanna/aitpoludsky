from decimal import Decimal

from django.db import models
from django.utils import timezone

from apps.shops.models import Shop


class Discount(models.Model):
    class Kind(models.TextChoices):
        PERCENT = "percent", "%"
        FIXED = "fixed", "Фіксована сума"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="discounts")
    code = models.CharField(max_length=32, help_text="Промокод (без пробілів).")
    name = models.CharField(max_length=120, blank=True)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.PERCENT)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    min_subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Мінімальна сума замовлення для активації.",
    )
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text="Порожньо = без обмеження.")
    uses_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("shop", "code"), name="discounts_unique_code_per_shop"),
        ]

    def __str__(self):
        return f"{self.code} ({self.kind})"

    def is_currently_active(self) -> bool:
        if not self.is_active:
            return False
        now = timezone.now()
        if self.starts_at and now < self.starts_at:
            return False
        if self.ends_at and now > self.ends_at:
            return False
        if self.max_uses is not None and self.uses_count >= self.max_uses:
            return False
        return True

    def compute_amount(self, subtotal: Decimal) -> Decimal:
        if self.kind == self.Kind.PERCENT:
            amount = (subtotal * self.value / Decimal("100")).quantize(Decimal("0.01"))
        else:
            amount = self.value
        return min(amount, subtotal).quantize(Decimal("0.01"))

    def validate_for_subtotal(self, subtotal: Decimal) -> str | None:
        """Повертає текст помилки, або None — якщо знижку можна застосувати."""
        if not self.is_active:
            return "Знижка неактивна."
        now = timezone.now()
        if self.starts_at and now < self.starts_at:
            return "Знижка ще не почала діяти."
        if self.ends_at and now > self.ends_at:
            return "Термін дії знижки завершено."
        if self.max_uses is not None and self.uses_count >= self.max_uses:
            return "Ліміт використань вичерпано."
        if subtotal < self.min_subtotal:
            return f"Мінімальна сума замовлення: {self.min_subtotal}."
        return None
