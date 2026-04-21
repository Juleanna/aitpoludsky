import re

from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Shop
from .serializers import ShopCreateSerializer, ShopSerializer

# Обмежені slug-и: шаблон SlugField (a-z0-9-, довжина 2..60).
_SLUG_RE = re.compile(r"^[a-z0-9-]{2,60}$")
# Заборонені значення, які конфліктують з адмінкою або планованими піддоменами.
_RESERVED_SLUGS = {"admin", "api", "www", "app", "mail", "shop", "pos", "static", "media"}


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


class ShopSlugCheckView(APIView):
    """GET /api/shops/check-slug/?slug=my-shop → перевіряє доступність slug.

    Повертає available=False якщо slug зайнятий, зарезервований або
    не відповідає формату. Причина — у полі reason (format|reserved|taken).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        slug = (request.query_params.get("slug") or "").strip().lower()
        if not _SLUG_RE.match(slug):
            return Response({"slug": slug, "available": False, "reason": "format"})
        if slug in _RESERVED_SLUGS:
            return Response({"slug": slug, "available": False, "reason": "reserved"})
        taken = Shop.objects.filter(slug=slug).exists()
        return Response({
            "slug": slug,
            "available": not taken,
            "reason": "taken" if taken else None,
        })


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
