from django.db import models

class Item(models.Model):
    name = models.CharField(max_length=180)
    brand = models.CharField(max_length=100, blank=True)
    description = models.CharField(max_length=255, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    @property
    def stock_value(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return self.name

class StockMovement(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="movements")
    changed_via = models.CharField(max_length=120)
    change_quantity = models.DecimalField(max_digits=12, decimal_places=2)
    changed_by = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.item.name}: {self.change_quantity}"
