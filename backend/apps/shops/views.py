from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Shop
from .serializers import ShopCreateSerializer, ShopSerializer


class ShopListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Shop.objects.filter(Q(owner=user) | Q(memberships__user=user))
            .distinct()
            .prefetch_related("memberships")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ShopCreateSerializer
        return ShopSerializer


class ShopDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShopSerializer
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user
        return (
            Shop.objects.filter(Q(owner=user) | Q(memberships__user=user))
            .distinct()
            .prefetch_related("memberships")
        )
