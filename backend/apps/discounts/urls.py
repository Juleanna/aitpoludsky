from django.urls import path

from .views import DiscountValidateView, DiscountViewSet

list_create = DiscountViewSet.as_view({"get": "list", "post": "create"})
detail = DiscountViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}
)

urlpatterns = [
    path("", list_create, name="discount-list"),
    path("validate/", DiscountValidateView.as_view(), name="discount-validate"),
    path("<int:pk>/", detail, name="discount-detail"),
]
