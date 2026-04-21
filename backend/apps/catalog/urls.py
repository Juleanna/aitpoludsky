from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductImageDetailView,
    ProductImageSetPrimaryView,
    ProductImagesReorderView,
    ProductImagesView,
    ProductViewSet,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("categories", CategoryViewSet, basename="category")

# Endpoint-и зображень живуть поза router-ом, щоб уникнути конфліктів шляхів.
# Router дає: /products/, /products/<pk>/
# Ми додаємо: /products/<pk>/images/ ... і підпорядковані.
urlpatterns = [
    path(
        "products/<int:product_pk>/images/",
        ProductImagesView.as_view(),
        name="product-images",
    ),
    path(
        "products/<int:product_pk>/images/reorder/",
        ProductImagesReorderView.as_view(),
        name="product-images-reorder",
    ),
    path(
        "products/<int:product_pk>/images/<int:pk>/",
        ProductImageDetailView.as_view(),
        name="product-image-detail",
    ),
    path(
        "products/<int:product_pk>/images/<int:pk>/set-primary/",
        ProductImageSetPrimaryView.as_view(),
        name="product-image-set-primary",
    ),
    *router.urls,
]
