from rest_framework import serializers
from .models import Item, StockMovement

class ItemSerializer(serializers.ModelSerializer):
    stock_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    class Meta:
        model = Item
        fields = ["id", "name", "brand", "description", "quantity", "unit_price", "stock_value"]

class StockMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    created_at = serializers.DateTimeField(format="%d/%m/%Y, %I:%M %p", read_only=True)
    class Meta:
        model = StockMovement
        fields = ["id", "item", "item_name", "changed_via", "change_quantity", "changed_by", "created_at"]
