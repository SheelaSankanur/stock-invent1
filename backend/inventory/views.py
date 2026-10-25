from decimal import Decimal, InvalidOperation
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Item, StockMovement
from .serializers import ItemSerializer, StockMovementSerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    search_fields = ["name", "brand", "description"]

class MovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related("item").all()
    serializer_class = StockMovementSerializer
    search_fields = ["item__name", "changed_via", "changed_by"]

@api_view(["GET"])
def summary(request):
    items = Item.objects.all()
    total_items = items.count()
    total_units = items.aggregate(total=Sum("quantity"))["total"] or 0
    valuation = sum((i.stock_value for i in items), Decimal("0.00"))
    return Response({
        "total_items": total_items,
        "total_units": total_units,
        "stock_valuation": str(valuation),
        "recent_movements": StockMovement.objects.count(),
    })

@api_view(["PATCH"])
def adjust_stock(request, item_id):
    try:
        item = Item.objects.get(pk=item_id)
    except Item.DoesNotExist:
        return Response({"detail": "Item not found"}, status=status.HTTP_404_NOT_FOUND)
    try:
        new_quantity = int(request.data.get("quantity"))
        if new_quantity < 0:
            raise ValueError()
    except (TypeError, ValueError):
        return Response({"detail": "quantity must be a non-negative integer"}, status=status.HTTP_400_BAD_REQUEST)
    delta = new_quantity - item.quantity
    item.quantity = new_quantity
    item.save()
    if delta:
        StockMovement.objects.create(
            item=item, changed_via="Manual Adjustment", change_quantity=Decimal(delta),
            changed_by=request.data.get("changed_by", "Admin")
        )
    return Response(ItemSerializer(item).data)
