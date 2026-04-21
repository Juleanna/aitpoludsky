from rest_framework.permissions import BasePermission


class IsShopMember(BasePermission):
    """Grants access only when ``TenantMiddleware`` resolved ``request.shop``.

    The middleware already verifies the requesting user is owner or member of
    the shop referenced by the ``X-Shop-Slug`` header, so presence of
    ``request.shop`` is sufficient proof of membership.
    """

    message = "Не вказано активний магазин (X-Shop-Slug) або немає доступу."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.shop)

    def has_object_permission(self, request, view, obj):
        return request.shop is not None and obj.shop_id == request.shop.id
