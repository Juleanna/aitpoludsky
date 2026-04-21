from django.urls import path

from .views import CustomerViewSet

list_create = CustomerViewSet.as_view({"get": "list", "post": "create"})
detail = CustomerViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}
)

urlpatterns = [
    path("", list_create, name="customer-list"),
    path("<int:pk>/", detail, name="customer-detail"),
]
