from api_http import build_urlpatterns
from api.health import HealthController
from restaurants.views import RestaurantsController

urlpatterns = [
    *build_urlpatterns(HealthController),
    *build_urlpatterns(RestaurantsController),
]