"""Restaurant discovery and homepage service."""

from __future__ import annotations

from wireup import injectable

from restaurants.filter_parser import RestaurantFilterParser
from restaurants.repositories import RestaurantRepository
from restaurants.search.geospatial import GeospatialRestaurantSearchEngine
from restaurants.service_base import RestaurantServiceBase


@injectable
class RestaurantDiscoveryService(RestaurantServiceBase):
    """Coordinates restaurant discovery and homepage data."""

    def __init__(
        self,
        repository: RestaurantRepository | None = None,
        filter_parser: RestaurantFilterParser | None = None,
        search_engine: GeospatialRestaurantSearchEngine | None = None,
    ) -> None:
        super().__init__(repository=repository)
        self.filter_parser = filter_parser or RestaurantFilterParser()
        self.search_engine = search_engine or GeospatialRestaurantSearchEngine()

    @property
    def service_name(self) -> str:
        return "discovery"

    def list_restaurants(self, filters: dict | None = None, sort: str | None = None):
        normalized_filters = self.filter_parser.normalize(filters or {})
        queryset = self.repository.list_restaurants(filters=normalized_filters, sort=sort)
        return self.search_engine.search(
            queryset,
            request=self.filter_parser.build_request(normalized_filters, sort=sort),
        )

    def list_favorite_restaurants(
        self,
        user,
        filters: dict | None = None,
        sort: str | None = None,
    ):
        normalized_filters = self.filter_parser.normalize(filters or {})
        queryset = self.repository.list_favorite_restaurants(
            user=user,
            filters=normalized_filters,
            sort=sort,
        )
        return self.search_engine.search(
            queryset,
            request=self.filter_parser.build_request(normalized_filters, sort=sort),
        )

    def list_categories(self):
        return self.repository.list_categories()

    def get_homepage_sections(self, *, limit: int = 5):
        return {
            "top_rated": list(self.repository.list_homepage_top_rated(limit=limit)),
            "newest": list(self.repository.list_homepage_newest(limit=limit)),
        }
