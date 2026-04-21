from django.db.models import Q
from django.utils.functional import SimpleLazyObject


def _resolve_shop(request):
    slug = request.headers.get("X-Shop-Slug")
    if not slug or not request.user.is_authenticated:
        return None
    from .models import Shop

    return (
        Shop.objects.filter(Q(owner=request.user) | Q(memberships__user=request.user))
        .filter(slug=slug)
        .distinct()
        .first()
    )


class TenantMiddleware:
    """Attach ``request.shop`` based on ``X-Shop-Slug`` header.

    Views that require a shop should check ``request.shop`` and return 400/404
    when it's missing. The middleware itself does not block unauthenticated or
    non-tenant requests — ``/api/auth/*`` and ``/api/shops/`` operate without a
    selected shop.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.shop = SimpleLazyObject(lambda: _resolve_shop(request))
        return self.get_response(request)
