from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Product, ProductImage
from .permissions import IsShopMember
from .serializers import CategorySerializer, ProductImageSerializer, ProductSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return Category.objects.filter(shop=self.request.shop)

    def perform_create(self, serializer):
        serializer.save(shop=self.request.shop)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return (
            Product.objects.filter(shop=self.request.shop)
            .select_related("category")
            .prefetch_related("variants", "images")
        )

    def perform_create(self, serializer):
        serializer.save(shop=self.request.shop)


# ── Endpoint-и завантаження / видалення / впорядкування зображень ──────

_MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 МБ


def _get_product(request, product_pk: int) -> Product:
    return get_object_or_404(Product, pk=product_pk, shop=request.shop)


class ProductImagesView(APIView):
    """POST — завантажити нове зображення (multipart/form-data)."""

    permission_classes = [IsAuthenticated, IsShopMember]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_pk):
        product = _get_product(request, product_pk)
        file = request.FILES.get("image")
        if not file:
            return Response({"image": "Потрібно передати файл."}, status=400)
        if not (file.content_type or "").startswith("image/"):
            return Response({"image": "Файл має бути зображенням."}, status=400)
        if file.size > _MAX_IMAGE_BYTES:
            return Response({"image": "Максимальний розмір — 5 МБ."}, status=400)

        has_primary = product.images.filter(is_primary=True).exists()
        img = ProductImage.objects.create(
            product=product,
            image=file,
            position=product.images.count(),
            is_primary=not has_primary,
            alt=request.data.get("alt", ""),
        )
        return Response(
            ProductImageSerializer(img, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProductImageDetailView(APIView):
    """DELETE — видалити зображення + файл."""

    permission_classes = [IsAuthenticated, IsShopMember]

    def delete(self, request, product_pk, pk):
        img = get_object_or_404(
            ProductImage, pk=pk, product_id=product_pk, product__shop=request.shop
        )
        was_primary = img.is_primary
        img.image.delete(save=False)
        img.delete()
        # Якщо видалили primary — призначити наступне перше.
        if was_primary:
            next_img = ProductImage.objects.filter(product_id=product_pk).first()
            if next_img:
                next_img.is_primary = True
                next_img.save(update_fields=["is_primary"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageSetPrimaryView(APIView):
    """POST — позначити зображення як головне (решта автоматично не-primary)."""

    permission_classes = [IsAuthenticated, IsShopMember]

    def post(self, request, product_pk, pk):
        img = get_object_or_404(
            ProductImage, pk=pk, product_id=product_pk, product__shop=request.shop
        )
        ProductImage.objects.filter(product_id=product_pk).update(is_primary=False)
        img.is_primary = True
        img.save(update_fields=["is_primary"])
        return Response(ProductImageSerializer(img, context={"request": request}).data)


class ProductImagesReorderView(APIView):
    """PATCH — передаємо {"ids": [3, 1, 2]} у новому порядку."""

    permission_classes = [IsAuthenticated, IsShopMember]

    def patch(self, request, product_pk):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list):
            return Response({"ids": "Має бути список ID."}, status=400)
        for pos, pk in enumerate(ids):
            ProductImage.objects.filter(
                pk=pk, product_id=product_pk, product__shop=request.shop
            ).update(position=pos)
        return Response(status=status.HTTP_204_NO_CONTENT)
