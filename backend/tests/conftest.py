from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Product
from apps.shops.models import Shop, ShopMembership


@pytest.fixture
def user(db):
    return User.objects.create_user(email="olena@example.com", password="sometestpass123", full_name="Олена")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="petro@example.com", password="sometestpass123", full_name="Петро")


@pytest.fixture
def shop(db, user):
    shop = Shop.objects.create(owner=user, name="Kavarnya", slug="kavarnya", default_language="uk")
    ShopMembership.objects.create(shop=shop, user=user, role=ShopMembership.Role.OWNER)
    return shop


@pytest.fixture
def other_shop(db, other_user):
    shop = Shop.objects.create(owner=other_user, name="Pekarnya", slug="pekarnya", default_language="uk")
    ShopMembership.objects.create(shop=shop, user=other_user, role=ShopMembership.Role.OWNER)
    return shop


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def tenant_client(api_client, shop):
    api_client.defaults["HTTP_X_SHOP_SLUG"] = shop.slug
    return api_client


@pytest.fixture
def product(shop):
    return Product.objects.create(
        shop=shop,
        sku="SKU-1",
        name="Еспресо",
        price=Decimal("100.00"),
        stock=10,
    )
