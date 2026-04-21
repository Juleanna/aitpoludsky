from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalog.permissions import IsShopMember

from .models import Message, Thread
from .serializers import MessageCreateSerializer, ThreadSerializer


class ThreadViewSet(viewsets.ModelViewSet):
    serializer_class = ThreadSerializer
    permission_classes = [IsAuthenticated, IsShopMember]

    def get_queryset(self):
        return Thread.objects.filter(shop=self.request.shop).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(shop=self.request.shop)

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        thread = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        msg = Message.objects.create(
            thread=thread,
            direction=Message.Direction.OUTBOUND,
            author_user=request.user if request.user.is_authenticated else None,
            author_name=serializer.validated_data.get("author_name")
            or (request.user.full_name or request.user.email if request.user.is_authenticated else ""),
            body=serializer.validated_data["body"],
        )
        thread.unread = False
        thread.save(update_fields=["unread", "updated_at"])
        return Response(MessageCreateSerializer(msg).data, status=status.HTTP_201_CREATED)
