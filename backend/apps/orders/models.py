from decimal import Decimal

from django.db import models, transaction

from apps.catalog.models import Product
from apps.customers.models import Customer
from apps.discounts.models import Discount
from apps.shops.models import Shop


class Order(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Чернетка"
        PENDING = "pending", "Очікує оплати"
        PAID = "paid", "Оплачено"
        SHIPPED = "shipped", "Відправлено"
        COMPLETED = "completed", "Виконано"
        CANCELLED = "cancelled", "Скасовано"

    class Channel(models.TextChoices):
        ONLINE = "online", "Онлайн"
        POS = "pos", "POS"
        MANUAL = "manual", "Вручну"

    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name="orders")
    number = models.CharField(max_length=32, blank=True)
    customer = models.ForeignKey(
        Customer,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=32, blank=True)
    customer_email = models.EmailField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    channel = models.CharField(max_length=16, choices=Channel.choices, default=Channel.MANUAL)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    discount = models.ForeignKey(
        Discount,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )
    discount_code = models.CharField(max_length=32, blank=True)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("shop", "number"), name="orders_unique_number_per_shop"),
        ]
        indexes = [
            models.Index(fields=("shop", "status")),
            models.Index(fields=("shop", "-created_at")),
        ]

    def __str__(self):
        return f"{self.number} · {self.customer_name}"

    def save(self, *args, **kwargs):
        if not self.number and self.shop_id:
            # Наївна автонумерація для MVP. При конкурентних записах спрацює
            # unique constraint (IntegrityError); політика retry — у serializer
            # (TODO, коли з'явиться реальна конкуренція).
            with transaction.atomic():
                last_num = (
                    Order.objects.filter(shop_id=self.shop_id)
                    .exclude(number="")
                    .order_by("-id")
                    .values_list("number", flat=True)
                    .first()
                )
                next_n = 1
                if last_num:
                    try:
                        next_n = int(last_num.rsplit("-", 1)[-1]) + 1
                    except ValueError:
                        next_n = Order.objects.filter(shop_id=self.shop_id).count() + 1
                self.number = f"AP-{next_n:05d}"
        super().save(*args, **kwargs)

    def recompute_totals(self):
        subtotal = sum((item.line_total for item in self.items.all()), Decimal("0.00"))
        self.subtotal = subtotal
        discount_amount = self.discount_amount or Decimal("0.00")
        if discount_amount > subtotal:
            discount_amount = subtotal
            self.discount_amount = discount_amount
        self.total = subtotal - discount_amount


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name="order_items")
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=32)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        ordering = ("id",)

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"

    def save(self, *args, **kwargs):
        self.line_total = (self.unit_price or Decimal("0")) * self.quantity
        super().save(*args, **kwargs)
