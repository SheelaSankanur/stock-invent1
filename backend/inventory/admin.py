from django.contrib import admin
from .models import Item, StockMovement

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "quantity", "unit_price", "updated_at")
    search_fields = ("name", "brand")

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ("item", "changed_via", "change_quantity", "changed_by", "created_at")
    list_filter = ("changed_via",)
