from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.shops.models import Shop

from .models import Category

# Стартовий набір категорій для новоствореного магазину.
# Власник може перейменувати/видалити/додати свої у будь-який момент.
DEFAULT_CATEGORY_NAMES = [
    "Кава та чай",
    "Одяг",
    "Косметика",
    "Хендмейд",
    "Продукти",
    "Інше",
]


@receiver(post_save, sender=Shop)
def seed_default_categories(sender, instance: Shop, created: bool, **_kwargs) -> None:
    """При створенні нового магазину наповнюємо його стартовими категоріями."""
    if not created:
        return
    # idempotent — не дублюємо якщо вже є (на випадок повторних signals).
    if instance.categories.exists():
        return
    Category.objects.bulk_create(
        [Category(shop=instance, name=name, position=idx) for idx, name in enumerate(DEFAULT_CATEGORY_NAMES)]
    )
