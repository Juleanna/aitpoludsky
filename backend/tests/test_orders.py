from decimal import Decimal

import pytest

from apps.catalog.models import Product
from apps.discounts.models import Discount
from apps.orders.models import Order


pytestmark = pytest.mark.django_db


def test_create_order_with_items(tenant_client, product):
    resp = tenant_client.post(
        "/api/orders/",
        {
            "customer_name": "Тест",
            "items": [{"product_id": product.id, "quantity": 2}],
        },
        format="json",
    )
    assert resp.status_code == 201, resp.data
    order = Order.objects.get(pk=resp.data["id"])
    assert order.number.startswith("AP-")
    assert order.items.count() == 1
    item = order.items.first()
    assert item.product_name == product.name
    assert item.unit_price == product.price
    assert item.line_total == product.price * 2
    assert order.subtotal == Decimal("200.00")
    assert order.total == Decimal("200.00")


def test_order_requires_items(tenant_client):
    resp = tenant_client.post(
        "/api/orders/",
        {"customer_name": "Тест", "items": []},
        format="json",
    )
    assert resp.status_code == 400
    assert "items" in resp.data


def test_order_rejects_foreign_shop_product(tenant_client, other_shop):
    foreign = Product.objects.create(
        shop=other_shop, sku="X", name="Чужий", price=Decimal("10"), stock=5
    )
    resp = tenant_client.post(
        "/api/orders/",
        {"customer_name": "Тест", "items": [{"product_id": foreign.id, "quantity": 1}]},
        format="json",
    )
    assert resp.status_code == 400


def test_order_applies_percent_discount(tenant_client, shop, product):
    Discount.objects.create(shop=shop, code="OFF10", kind=Discount.Kind.PERCENT, value=Decimal("10"))
    resp = tenant_client.post(
        "/api/orders/",
        {
            "customer_name": "Тест",
            "items": [{"product_id": product.id, "quantity": 1}],
            "discount_code_input": "off10",  # case-insensitive
        },
        format="json",
    )
    assert resp.status_code == 201, resp.data
    assert resp.data["discount_code"] == "OFF10"
    assert Decimal(resp.data["discount_amount"]) == Decimal("10.00")
    assert Decimal(resp.data["total"]) == Decimal("90.00")
    Discount.objects.get(code="OFF10").uses_count == 1


def test_order_unknown_discount_code(tenant_client, product):
    resp = tenant_client.post(
        "/api/orders/",
        {
            "customer_name": "Тест",
            "items": [{"product_id": product.id, "quantity": 1}],
            "discount_code_input": "NOPE",
        },
        format="json",
    )
    assert resp.status_code == 400
    assert "discount_code_input" in resp.data
