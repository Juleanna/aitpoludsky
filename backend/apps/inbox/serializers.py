from rest_framework import serializers

from apps.customers.models import Customer

from .models import Message, Thread


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "direction", "author_name", "body", "created_at")
        read_only_fields = ("id", "created_at")


class ThreadSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        source="customer",
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    customer_name = serializers.CharField(source="customer.name", read_only=True, default="")
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = (
            "id",
            "channel",
            "subject",
            "customer",
            "customer_id",
            "customer_name",
            "unread",
            "external_id",
            "messages",
            "last_message",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "customer", "customer_name", "messages", "last_message", "created_at", "updated_at")

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if msg is None:
            return None
        return {
            "direction": msg.direction,
            "body": msg.body[:120],
            "created_at": msg.created_at.isoformat(),
        }


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "direction", "body", "author_name", "created_at")
        read_only_fields = ("id", "created_at")
