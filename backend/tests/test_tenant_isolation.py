from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Product


pytestmark = pytest.mark.django_db


def test_products_list_scoped_to_shop(tenant_client, shop, other_shop):
    """Каталог має повертати лише товари магазину, названого в X-Shop-Slug."""
    Product.objects.create(shop=shop, sku="MINE", name="Мій", price=Decimal("50"), stock=1)
    Product.objects.create(shop=other_shop, sku="OTHER", name="Чужий", price=Decimal("50"), stock=1)

    resp = tenant_client.get("/api/catalog/products/")
    assert resp.status_code == 200
    skus = [p["sku"] for p in resp.data]
    assert "MINE" in skus
    assert "OTHER" not in skus


def test_other_shop_inaccessible_via_header(api_client, other_shop):
    """Користувач не повинен мати змоги запитувати чужий магазин через його slug."""
    api_client.defaults["HTTP_X_SHOP_SLUG"] = other_shop.slug
    resp = api_client.get("/api/catalog/products/")
    # Middleware не визначить other_shop для цього користувача → IsShopMember віддасть 403.
    assert resp.status_code == 403


def test_missing_shop_slug_header_rejected(api_client):
    """Endpoint каталогу вимагає активний магазин; без заголовка — 403."""
    resp = api_client.get("/api/catalog/products/")
    assert resp.status_code == 403


def test_unauthenticated_cannot_access_catalog():
    client = APIClient()
    resp = client.get("/api/catalog/products/")
    assert resp.status_code == 403
