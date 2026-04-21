from django.db import models

from apps.shops.models import Shop


class Category(models.Model):
    """Категорія товарів магазину. Власна — кожен магазин веде свій список."""

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    position = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("position", "id")
        constraints = [
            models.UniqueConstraint(fields=("shop", "name"), name="catalog_unique_category_per_shop"),
        ]

    def __str__(self):
        return f"{self.shop.slug} · {self.name}"


class Product(models.Model):
    """Товар магазину. Містить всі комерційні, медіа-, SEO- і маркетингові поля."""

    class VatStatus(models.TextChoices):
        NONE = "none", "Без ПДВ"
        V20 = "20", "ПДВ 20%"
        V7 = "7", "ПДВ 7%"

    # ── Ідентифікація та основне ────────────────────────────────
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="products")
    sku = models.CharField(max_length=32)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Категоризація (впливає на фільтри і SEO). Кожен магазин веде свій список.
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="products",
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
        ]

    def __str__(self):
        return f"{self.name} [{self.sku}]"


def _product_image_path(instance: "ProductImage", filename: str) -> str:
    # products/<shop_slug>/<product_id>/<filename>
    return f"products/{instance.product.shop.slug}/{instance.product_id}/{filename}"


class ProductImage(models.Model):
    """Файл-зображення товару. Зберігається у MEDIA_ROOT (локально або S3 у prod)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.FileField(upload_to=_product_image_path)
    position = models.IntegerField(default=0, help_text="Порядок у списку зображень.")
    is_primary = models.BooleanField(
        default=False,
        help_text="Головне зображення — використовується як hero на картці товару.",
    )
    alt = models.CharField(max_length=200, blank=True, help_text="Alt-текст для SEO/доступності.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return f"{self.product.name} · #{self.pk}"


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
