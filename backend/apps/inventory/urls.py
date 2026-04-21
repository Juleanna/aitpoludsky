from django.urls import path

from .views import StockMovementViewSet

list_create = StockMovementViewSet.as_view({"get": "list", "post": "create"})
detail = StockMovementViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    path("movements/", list_create, name="stock-movement-list"),
    path("movements/<int:pk>/", detail, name="stock-movement-detail"),
]
