from django.urls import path

from .views import ShopDetailView, ShopListCreateView

urlpatterns = [
    path("", ShopListCreateView.as_view(), name="shop-list"),
    path("<slug:slug>/", ShopDetailView.as_view(), name="shop-detail"),
]
