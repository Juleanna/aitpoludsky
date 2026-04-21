from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.catalog.permissions import IsShopMember

from .models import Order
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return Order.objects.filter(shop=self.request.shop).prefetch_related("items")

    def perform_create(self, serializer):
        serializer.save(shop=self.request.shop)
