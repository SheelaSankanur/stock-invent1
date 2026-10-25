from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, MovementViewSet, summary, adjust_stock

router = DefaultRouter()
router.register("items", ItemViewSet, basename="item")
router.register("movements", MovementViewSet, basename="movement")

urlpatterns = [
    path("", include(router.urls)),
    path("summary/", summary),
    path("items/<int:item_id>/adjust-stock/", adjust_stock),
]
