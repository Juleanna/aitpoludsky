from django.urls import path

from .views import OrderViewSet

list_create = OrderViewSet.as_view({"get": "list", "post": "create"})
detail = OrderViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}
)

urlpatterns = [
    path("", list_create, name="order-list"),
    path("<int:pk>/", detail, name="order-detail"),
]
