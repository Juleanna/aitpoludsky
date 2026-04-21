from decimal import Decimal

import pytest

from apps.catalog.models import Product
from apps.inventory.models import StockMovement


pytestmark = pytest.mark.django_db


def test_receipt_increases_stock(tenant_client, product):
    resp = tenant_client.post(
        "/api/inventory/movements/",
        {"product_id": product.id, "kind": "receipt", "delta": 5},
        format="json",
    )
    assert resp.status_code == 201, resp.data
    product.refresh_from_db()
    assert product.stock == 15
    assert resp.data["balance_after"] == 15


def test_issue_cannot_go_negative(tenant_client, product):
    resp = tenant_client.post(
        "/api/inventory/movements/",
        {"product_id": product.id, "kind": "issue", "delta": -999},
        format="json",
    )
    assert resp.status_code == 400
    product.refresh_from_db()
    assert product.stock == 10  # unchanged


def test_zero_delta_rejected(tenant_client, product):
    resp = tenant_client.post(
        "/api/inventory/movements/",
        {"product_id": product.id, "kind": "adjustment", "delta": 0},
        format="json",
    )
    assert resp.status_code == 400


def test_concurrent_receipts_do_not_lose_updates(tenant_client, product):
    """Декілька послідовних приходів через API мають сумарно оновлювати stock через F()."""
    for delta in (3, 4, 5):
        resp = tenant_client.post(
            "/api/inventory/movements/",
            {"product_id": product.id, "kind": "receipt", "delta": delta},
            format="json",
        )
        assert resp.status_code == 201, resp.data
    product.refresh_from_db()
    assert product.stock == 10 + 3 + 4 + 5
    assert StockMovement.objects.filter(product=product).count() == 3


def test_foreign_shop_product_rejected(tenant_client, other_shop):
    foreign = Product.objects.create(
        shop=other_shop, sku="X", name="Чужий", price=Decimal("10"), stock=5
    )
    resp = tenant_client.post(
        "/api/inventory/movements/",
        {"product_id": foreign.id, "kind": "receipt", "delta": 1},
        format="json",
    )
    assert resp.status_code == 400
