from decimal import Decimal

from django.db.models import Count, Max, Sum
from django.db.models.functions import Coalesce
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.catalog.permissions import IsShopMember

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return Customer.objects.filter(shop=self.request.shop).annotate(
            orders_count=Count("orders"),
            total_spent=Coalesce(Sum("orders__total"), Decimal("0.00")),
            last_order_at=Max("orders__created_at"),
        )

    def perform_create(self, serializer):
        serializer.save(shop=self.request.shop)
