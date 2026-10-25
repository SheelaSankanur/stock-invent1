from decimal import Decimal
from django.core.management.base import BaseCommand
from inventory.models import Item, StockMovement

class Command(BaseCommand):
    help = "Create sample inventory items and stock movement history"

    def handle(self, *args, **options):
        samples = [
            ("Keyboard", "Logitech", "Wireless keyboard", 200, "12500.00"),
            ("Battery", "", "Capacity: 70 Whr", 150, "18000.00"),
            ("Display", "", "15.6 inches, Resolution: 1920 x 1080 pixels", 120, "22000.00"),
            ("Storage", "", "512 GB SSD", 80, "16000.00"),
        ]
        for name, brand, description, quantity, price in samples:
            item, created = Item.objects.get_or_create(
                name=name,
                defaults={"brand": brand, "description": description, "quantity": quantity,
                          "unit_price": Decimal(price)}
            )
            if created:
                StockMovement.objects.create(item=item, changed_via="Opening Stock",
                    change_quantity=Decimal(quantity), changed_by="Admin")
        self.stdout.write(self.style.SUCCESS("Demo inventory data is ready."))
