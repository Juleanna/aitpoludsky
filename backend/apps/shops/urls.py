from django.urls import path

from .views import ShopDetailView, ShopListCreateView, ShopSlugCheckView

urlpatterns = [
    path("", ShopListCreateView.as_view(), name="shop-list"),
    # Важливо: перевірка slug — ДО шляху <slug:slug>, інакше перехопиться як detail.
    path("check-slug/", ShopSlugCheckView.as_view(), name="shop-slug-check"),
    path("<slug:slug>/", ShopDetailView.as_view(), name="shop-detail"),
]
