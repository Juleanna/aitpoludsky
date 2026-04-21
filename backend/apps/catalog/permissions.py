from rest_framework.permissions import BasePermission


class IsShopMember(BasePermission):
    """Надає доступ лише коли ``TenantMiddleware`` визначив ``request.shop``.

    Middleware вже перевіряє, що користувач є власником або членом магазину,
    вказаного у заголовку ``X-Shop-Slug``, тож сама наявність ``request.shop``
    є достатнім підтвердженням участі.
    """

    message = "Не вказано активний магазин (X-Shop-Slug) або немає доступу."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.shop)

    def has_object_permission(self, request, view, obj):
        return request.shop is not None and obj.shop_id == request.shop.id
