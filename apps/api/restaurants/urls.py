from api_http import build_urlpatterns
from restaurants.views import RestaurantsController

urlpatterns = [
    *build_urlpatterns(RestaurantsController),
]