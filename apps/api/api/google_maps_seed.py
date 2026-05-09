"""Utilities for normalizing Google Maps scrape data into seed records."""

from __future__ import annotations

import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Mapping


COORD_PATTERN_AT = re.compile(r"@(-?\d+\.\d+),(-?\d+\.\d+)")
COORD_PATTERN_BANG = re.compile(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)")


def normalize_google_place(place: Mapping[str, Any]) -> dict[str, Any]:
    """Normalize one scraped Google Maps place into canonical seed fields."""

    latitude, longitude = _resolve_coordinates(place)
    city, district, postal_code = _extract_address_components(
        str(place.get("address") or ""),
        fallback_region=str(place.get("region") or ""),
    )

    return {
        "source_url": str(place.get("source_url") or "").strip(),
        "name": str(place.get("name") or "").strip(),
        "region": str(place.get("region") or "").strip(),
        "category": str(place.get("category") or "Restoran").strip() or "Restoran",
        "address": str(place.get("address") or "").strip(),
        "phone": _normalize_phone(str(place.get("phone") or "")),
        "website": str(place.get("website") or "").strip(),
        "rating": _to_decimal(place.get("rating"), "0.01") or Decimal("0.00"),
        "review_count": _to_int(place.get("review_count")),
        "latitude": latitude,
        "longitude": longitude,
        "city": city,
        "district": district,
        "postal_code": postal_code,
    }


def extract_coordinates(source_url: str) -> tuple[Decimal | None, Decimal | None]:
    """Extract latitude/longitude from a Google Maps place URL."""

    if not source_url:
        return None, None

    match = COORD_PATTERN_AT.search(source_url) or COORD_PATTERN_BANG.search(
        source_url
    )
    if not match:
        return None, None

    return _to_decimal(match.group(1), "0.00000001"), _to_decimal(
        match.group(2), "0.00000001"
    )


def _resolve_coordinates(place: Mapping[str, Any]) -> tuple[Decimal | None, Decimal | None]:
    latitude = _to_decimal(place.get("lat"), "0.00000001")
    longitude = _to_decimal(place.get("lng"), "0.00000001")
    if latitude is not None and longitude is not None:
        return latitude, longitude

    return extract_coordinates(str(place.get("source_url") or ""))


def _extract_address_components(
    address: str,
    *,
    fallback_region: str,
) -> tuple[str, str, str]:
    city = "Istanbul"
    district = fallback_region.title().strip() or "Istanbul"
    postal_code = ""

    clean_address = re.sub(r"\s+", " ", address).strip()
    postal_match = re.search(r"\b\d{5}\b", clean_address)
    if postal_match:
        postal_code = postal_match.group(0)

    parts = [part.strip() for part in clean_address.split(",") if part.strip()]
    if parts:
        district = parts[0]
        city_part = parts[-1]
        if "/" in city_part:
            city = city_part.split("/")[-1].strip() or city
        elif len(parts) > 1:
            city = parts[-1]

    return city[:100], district[:100], postal_code[:20]


def _normalize_phone(phone: str) -> str:
    normalized = re.sub(r"[^0-9+]", "", phone or "")
    if "+" in normalized and not normalized.startswith("+"):
        normalized = normalized.replace("+", "")
    if normalized.count("+") > 1:
        normalized = "+" + normalized.replace("+", "")
    return normalized[:20]


def _to_decimal(value: Any, quantizer: str) -> Decimal | None:
    if value is None or value == "":
        return None

    try:
        return Decimal(str(value)).quantize(Decimal(quantizer), rounding=ROUND_HALF_UP)
    except Exception:
        return None


def _to_int(value: Any) -> int | None:
    if value is None or value == "":
        return None

    try:
        return int(Decimal(str(value)))
    except Exception:
        return None
