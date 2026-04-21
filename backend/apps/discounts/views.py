from decimal import Decimal

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.permissions import IsShopMember

from .models import Discount
from .serializers import DiscountSerializer, DiscountValidationSerializer


class DiscountViewSet(viewsets.ModelViewSet):
    serializer_class = DiscountSerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return Discount.objects.filter(shop=self.request.shop)

    def perform_create(self, serializer):
        serializer.save(shop=self.request.shop)


class DiscountValidateView(APIView):
    """Перевіряє знижку для гіпотетичної суми (без побічних ефектів)."""

    permission_classes = [IsAuthenticated, IsShopMember]

    def post(self, request):
        serializer = DiscountValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"].strip()
        subtotal: Decimal = serializer.validated_data["subtotal"]

        try:
            discount = Discount.objects.get(shop=request.shop, code__iexact=code)
        except Discount.DoesNotExist:
            return Response(
                {"valid": False, "error": "Промокод не знайдено."},
                status=status.HTTP_404_NOT_FOUND,
            )

        error = discount.validate_for_subtotal(subtotal)
        if error:
            return Response({"valid": False, "error": error, "code": discount.code})

        amount = discount.compute_amount(subtotal)
        return Response(
            {
                "valid": True,
                "code": discount.code,
                "name": discount.name,
                "kind": discount.kind,
                "value": str(discount.value),
                "discount_amount": str(amount),
                "new_total": str(subtotal - amount),
            }
        )
