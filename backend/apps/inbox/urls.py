from django.urls import path

from .views import ThreadViewSet

list_create = ThreadViewSet.as_view({"get": "list", "post": "create"})
detail = ThreadViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)
reply = ThreadViewSet.as_view({"post": "reply"})

urlpatterns = [
    path("threads/", list_create, name="thread-list"),
    path("threads/<int:pk>/", detail, name="thread-detail"),
    path("threads/<int:pk>/reply/", reply, name="thread-reply"),
]
