from django.conf import settings
from django.db import models

from .constants import DEFAULT_LANGUAGE, LANGUAGE_CHOICES


class Shop(models.Model):
    CURRENCY_CHOICES = [
        ("UAH", "₴ Гривня"),
        ("USD", "$ Долар"),
        ("EUR", "€ Євро"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_shops",
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=60, unique=True)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="UAH")
    default_language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default=DEFAULT_LANGUAGE,
        help_text="Мова, якою створюються назви/описи товарів у основних полях.",
    )
    languages = models.JSONField(
        default=list,
        blank=True,
        help_text="Коди додаткових мов, на які магазин перекладає товари.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} ({self.slug})"


class ShopMembership(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Власник"
        ADMIN = "admin", "Адмін"
        STAFF = "staff", "Співробітник"
        VIEWER = "viewer", "Переглядач"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shop_memberships",
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STAFF)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("shop", "user")
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} @ {self.shop.slug} ({self.role})"
