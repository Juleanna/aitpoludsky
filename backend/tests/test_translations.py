from decimal import Decimal

import pytest


pytestmark = pytest.mark.django_db


def test_product_translation_for_shop_language(tenant_client, shop):
    shop.languages = ["en", "pl"]
    shop.save(update_fields=["languages"])

    resp = tenant_client.post(
        "/api/catalog/products/",
        {
            "sku": "T1",
            "name": "Кава",
            "price": "50.00",
            "stock": 5,
            "translations": {"en": {"name": "Coffee"}, "pl": {"name": "Kawa"}},
        },
        format="json",
    )
    assert resp.status_code == 201, resp.data
    assert resp.data["translations"] == {"en": {"name": "Coffee"}, "pl": {"name": "Kawa"}}


def test_product_rejects_unconfigured_language(tenant_client, shop):
    shop.languages = ["en"]  # default_language is uk
    shop.save(update_fields=["languages"])

    resp = tenant_client.post(
        "/api/catalog/products/",
        {
            "sku": "T2",
            "name": "Кава",
            "price": Decimal("50.00"),
            "stock": 5,
            "translations": {"de": {"name": "Kaffee"}},
        },
        format="json",
    )
    assert resp.status_code == 400
    assert "translations" in resp.data


def test_shop_rejects_unknown_language_code(api_client):
    # create shop via API with bogus language code → 400
    resp = api_client.post(
        "/api/shops/",
        {
            "name": "X",
            "slug": "xshop",
            "default_language": "uk",
            "languages": ["zz"],  # invalid
        },
        format="json",
    )
    assert resp.status_code == 400
    assert "languages" in resp.data
