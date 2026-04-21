from django.db import models

from apps.shops.models import Shop


class Product(models.Model):
    """Товар магазину. Містить всі комерційні, медіа-, SEO- і маркетингові поля."""

    class Category(models.TextChoices):
        COFFEE = "coffee", "Кава та чай"
        CLOTHES = "clothes", "Одяг"
        COSMETICS = "cosmetics", "Косметика"
        HANDMADE = "handmade", "Хендмейд"
        FOOD = "food", "Продукти"
        OTHER = "other", "Інше"

    class VatStatus(models.TextChoices):
        NONE = "none", "Без ПДВ"
        V20 = "20", "ПДВ 20%"
        V7 = "7", "ПДВ 7%"

    # ── Ідентифікація та основне ────────────────────────────────
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    sku = models.CharField(max_length=32)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Категоризація (впливає на фільтри і SEO)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    brand = models.CharField(max_length=120, blank=True)
    producer = models.CharField(max_length=120, blank=True)
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Список рядків-тегів (для пошуку, фільтрів, аналітики).",
    )

    # ── Ціна і фінанси ──────────────────────────────────────────
    price = models.DecimalField(max_digits=12, decimal_places=2)
    # Ціна до знижки — показується перекресленою на картці.
    compare_at_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    # Собівартість — приватне поле для розрахунку маржі.
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    vat_status = models.CharField(
        max_length=8,
        choices=VatStatus.choices,
        default=VatStatus.NONE,
    )

    # ── Склад і фізичні характеристики ──────────────────────────
    stock = models.PositiveIntegerField(default=0)
    barcode = models.CharField(max_length=32, blank=True)
    weight_grams = models.PositiveIntegerField(null=True, blank=True)

    # ── Видимість і переклади ───────────────────────────────────
    is_active = models.BooleanField(default=True)
    translations = models.JSONField(
        default=dict,
        blank=True,
        help_text='Формат: {"en": {"name": "...", "description": "..."}, "pl": {...}}',
    )

    # ── SEO ────────────────────────────────────────────────────
    url_slug = models.SlugField(
        max_length=100,
        blank=True,
        help_text="Суфікс URL товару на публічній вітрині (унікальний у межах магазину).",
    )
    meta_title = models.CharField(max_length=120, blank=True)
    meta_description = models.TextField(max_length=320, blank=True)

    # ── Канали публікації ──────────────────────────────────────
    # Список рядків з множини {"web", "ig", "google", "pos"}.
    channels = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("shop", "sku"),
                name="catalog_unique_sku_per_shop",
            ),
            # url_slug унікальний у межах магазину, але лише коли не порожній
            # (partial unique index у Postgres).
            models.UniqueConstraint(
                fields=("shop", "url_slug"),
                condition=~models.Q(url_slug=""),
                name="catalog_unique_url_slug_per_shop",
            ),
        ]
        indexes = [
            models.Index(fields=("shop", "is_active")),
            models.Index(fields=("shop", "category")),
        ]

    def __str__(self):
        return f"{self.name} [{self.sku}]"


class ProductVariant(models.Model):
    """Варіант товару — окремий SKU, ціна, запас (напр. «Темна / 250г»)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
    )
    name = models.CharField(max_length=120)
    sku = models.CharField(max_length=48)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    position = models.IntegerField(default=0)

    class Meta:
        ordering = ("position", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("product", "sku"),
                name="catalog_unique_variant_sku_per_product",
            ),
        ]

    def __str__(self):
        return f"{self.name} [{self.sku}]"
