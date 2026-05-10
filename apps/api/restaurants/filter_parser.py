"""Restaurant discovery filter normalization."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation

from api.exceptions import ApiError
from restaurants.search.geospatial import GeoDiscoveryRequest
from wireup import injectable


@injectable
class RestaurantFilterParser:
    """Normalize discovery filters and build geospatial requests."""

    def normalize(self, filters: dict) -> dict:
        normalized: dict = {}

        category = filters.get("category")
        if category:
            normalized["category"] = str(category).strip().lower()

        city = filters.get("city")
        if city:
            normalized["city"] = str(city).strip()

        location = filters.get("location")
        if location:
            normalized["location"] = str(location).strip()

        search = filters.get("search")
        if search:
            normalized["search"] = str(search).strip()

        latitude, longitude = self._extract_coordinates(filters)
        if latitude is not None and longitude is not None:
            normalized["latitude"] = latitude
            normalized["longitude"] = longitude

        price_range = filters.get("price_range") or filters.get("price")
        if price_range:
            price_range = str(price_range).strip()
            if price_range not in {"1", "2", "3"}:
                raise ApiError(
                    status_code=400,
                    code="invalid_filter",
                    detail="price must be one of: 1, 2, 3.",
                )
            normalized["price_range"] = price_range

        min_rating = filters.get("min_rating")
        if min_rating not in (None, ""):
            try:
                min_rating_value = Decimal(str(min_rating))
            except (InvalidOperation, ValueError):
                raise ApiError(
                    status_code=400,
                    code="invalid_filter",
                    detail="min_rating must be a number between 0 and 5.",
                ) from None

            if min_rating_value < 0 or min_rating_value > 5:
                raise ApiError(
                    status_code=400,
                    code="invalid_filter",
                    detail="min_rating must be a number between 0 and 5.",
                )

            normalized["min_rating"] = min_rating_value

        return normalized

    def build_request(self, normalized_filters: dict, *, sort: str | None) -> GeoDiscoveryRequest:
        return GeoDiscoveryRequest(
            location=normalized_filters.get("location"),
            latitude=normalized_filters.get("latitude"),
            longitude=normalized_filters.get("longitude"),
            sort=sort,
        )

    def _extract_coordinates(self, filters: dict) -> tuple[float | None, float | None]:
        latitude_value = filters.get("latitude")
        longitude_value = filters.get("longitude")
        lat_alias = filters.get("lat")
        lng_alias = filters.get("lng")

        if lat_alias not in (None, "") or lng_alias not in (None, ""):
            latitude_value = lat_alias
            longitude_value = lng_alias

        has_latitude = latitude_value not in (None, "")
        has_longitude = longitude_value not in (None, "")
        if has_latitude != has_longitude:
            raise ApiError(
                status_code=400,
                code="invalid_filter",
                detail="latitude and longitude must be provided together.",
            )

        if not has_latitude:
            return None, None

        return self._normalize_latitude(latitude_value), self._normalize_longitude(longitude_value)

    def _normalize_latitude(self, value: object) -> float:
        try:
            latitude = float(str(value).strip())
        except (TypeError, ValueError):
            raise ApiError(
                status_code=400,
                code="invalid_filter",
                detail="latitude must be a number between -90 and 90.",
            ) from None

        if latitude < -90 or latitude > 90:
            raise ApiError(
                status_code=400,
                code="invalid_filter",
                detail="latitude must be a number between -90 and 90.",
            )
        return latitude

    def _normalize_longitude(self, value: object) -> float:
        try:
            longitude = float(str(value).strip())
        except (TypeError, ValueError):
            raise ApiError(
                status_code=400,
                code="invalid_filter",
                detail="longitude must be a number between -180 and 180.",
            ) from None

        if longitude < -180 or longitude > 180:
            raise ApiError(
                status_code=400,
                code="invalid_filter",
                detail="longitude must be a number between -180 and 180.",
            )
        return longitude
