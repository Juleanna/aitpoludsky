from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.catalog.permissions import IsShopMember

from .models import StockMovement
from .serializers import StockMovementSerializer


class StockMovementViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Stock movements are append-only history: no update / delete endpoints."""

    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return StockMovement.objects.filter(shop=self.request.shop).select_related("product", "created_by")
