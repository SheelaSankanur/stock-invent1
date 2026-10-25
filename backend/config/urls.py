from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "message": "Stock Inventory API is running",
        "frontend": "http://localhost:5173/",
        "items": "/api/items/",
        "movements": "/api/movements/",
        "summary": "/api/summary/",
    })


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/", include("inventory.urls")),
]