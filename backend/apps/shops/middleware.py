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
    """Прикріпляє ``request.shop`` на основі заголовка ``X-Shop-Slug``.

    View-и, які потребують магазин, мають перевіряти ``request.shop`` та
    повертати 400/404, якщо його немає. Сам middleware не блокує
    неавтентифіковані запити чи ті, що не потребують tenant — ``/api/auth/*``
    і ``/api/shops/`` працюють без обраного магазину.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.shop = SimpleLazyObject(lambda: _resolve_shop(request))
        return self.get_response(request)
