from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Product
from .permissions import IsShopMember
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return Product.objects.filter(shop=self.request.shop)

    def perform_create(self, serializer):
        serializer.save(shop=self.request.shop)
