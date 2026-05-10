"""Restaurant geospatial discovery engine."""

from __future__ import annotations

from dataclasses import dataclass
from math import atan2, cos, radians, sin, sqrt
from typing import Iterable

from django.db.models import Q, QuerySet

from restaurants.models import Restaurant


@dataclass(frozen=True, slots=True)
class GeoDiscoveryRequest:
    """Normalized discovery intent used by the geospatial engine."""

    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    sort: str | None = None

    @property
    def has_coordinates(self) -> bool:
        return self.latitude is not None and self.longitude is not None

    @property
    def wants_distance_sort(self) -> bool:
        return self.sort == "distance" and self.has_coordinates


class HaversineDistanceCalculator:
    """Calculate straight-line distance between two geographic points."""

    radius_km = 6371.0

    def calculate(
        self,
        *,
        origin_latitude: float,
        origin_longitude: float,
        target_latitude: float,
        target_longitude: float,
    ) -> float:
        delta_lat = radians(target_latitude - origin_latitude)
        delta_lng = radians(target_longitude - origin_longitude)
        origin_lat_rad = radians(origin_latitude)
        target_lat_rad = radians(target_latitude)

        a = (
            sin(delta_lat / 2) ** 2
            + cos(origin_lat_rad) * cos(target_lat_rad) * sin(delta_lng / 2) ** 2
        )
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return round(self.radius_km * c, 1)


class GeospatialRestaurantSearchEngine:
    """Apply location filters and optional distance ranking.

    The engine stays persistence-agnostic. It accepts either a queryset or an
    iterable, applies location matching, and decorates restaurants with
    `distance_km` when coordinates are available.
    """

    def __init__(self, distance_calculator: HaversineDistanceCalculator | None = None):
        self.distance_calculator = distance_calculator or HaversineDistanceCalculator()

    def search(
        self,
        restaurants: QuerySet[Restaurant] | Iterable[Restaurant],
        *,
        request: GeoDiscoveryRequest,
    ) -> list[Restaurant]:
        scoped = self._apply_location_filter(restaurants, request.location)
        items = list(scoped)

        if request.has_coordinates:
            self._attach_distances(items, request)

        if request.wants_distance_sort:
            items.sort(key=self._distance_sort_key)

        return items

    def _apply_location_filter(
        self,
        restaurants: QuerySet[Restaurant] | Iterable[Restaurant],
        location: str | None,
    ) -> QuerySet[Restaurant] | Iterable[Restaurant]:
        normalized_location = (location or "").strip()
        if not normalized_location:
            return restaurants

        terms = [term for term in normalized_location.split() if term]
        if not terms:
            return restaurants

        if isinstance(restaurants, QuerySet):
            query = Q()
            for term in terms:
                query &= (
                    Q(city__icontains=term)
                    | Q(district__icontains=term)
                    | Q(address_line1__icontains=term)
                    | Q(postal_code__icontains=term)
                )
            return restaurants.filter(query).distinct()

        filtered: list[Restaurant] = []
        for restaurant in restaurants:
            haystack = " ".join(
                part
                for part in (
                    getattr(restaurant, "city", None),
                    getattr(restaurant, "district", None),
                    getattr(restaurant, "address_line1", None),
                    getattr(restaurant, "postal_code", None),
                )
                if part
            ).lower()

            if all(term.lower() in haystack for term in terms):
                filtered.append(restaurant)

        return filtered

    def _attach_distances(
        self,
        restaurants: list[Restaurant],
        request: GeoDiscoveryRequest,
    ) -> None:
        for restaurant in restaurants:
            restaurant_latitude = self._to_float(getattr(restaurant, "latitude", None))
            restaurant_longitude = self._to_float(getattr(restaurant, "longitude", None))
            if restaurant_latitude is None or restaurant_longitude is None:
                continue

            distance = self.distance_calculator.calculate(
                origin_latitude=request.latitude if request.latitude is not None else 0,
                origin_longitude=request.longitude if request.longitude is not None else 0,
                target_latitude=restaurant_latitude,
                target_longitude=restaurant_longitude,
            )
            setattr(restaurant, "distance_km", distance)

    def _distance_sort_key(self, restaurant: Restaurant) -> tuple[float, str, str]:
        distance = self._to_float(getattr(restaurant, "distance_km", None))
        if distance is None:
            distance = float("inf")
        return (distance, restaurant.name.lower(), restaurant.slug)

    def _to_float(self, value: object) -> float | None:
        if value is None:
            return None

        try:
            numeric = float(value)
        except (TypeError, ValueError):
            return None

        if numeric != numeric:
            return None
        return numeric
