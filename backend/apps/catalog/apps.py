from django.apps import AppConfig


class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.catalog"

    def ready(self) -> None:
        # Реєструємо signal-и для автозасівання категорій при створенні магазину.
        from . import signals  # noqa: F401
