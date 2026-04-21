from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.catalog.models import Product


pytestmark = pytest.mark.django_db


def test_public_products_no_auth(shop):
    Product.objects.create(shop=shop, sku="A1", name="Active", price=Decimal("10"), stock=5, is_active=True)
    Product.objects.create(shop=shop, sku="A2", name="Hidden", price=Decimal("10"), stock=5, is_active=False)
    Product.objects.create(shop=shop, sku="A3", name="NoStock", price=Decimal("10"), stock=0, is_active=True)

    client = APIClient()
    resp = client.get(f"/api/public/{shop.slug}/products/")
    assert resp.status_code == 200
    skus = [p["sku"] for p in resp.data]
    assert skus == ["A1"]  # only active with stock


def test_public_shop_endpoint_exposes_languages(shop):
    shop.languages = ["en", "pl"]
    shop.save(update_fields=["languages"])

    client = APIClient()
    resp = client.get(f"/api/public/{shop.slug}/")
    assert resp.status_code == 200
    assert resp.data["slug"] == shop.slug
    assert resp.data["default_language"] == "uk"
    assert resp.data["languages"] == ["en", "pl"]
