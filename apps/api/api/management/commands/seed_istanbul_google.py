"""Seed Istanbul restaurants from Google Places API."""

from __future__ import annotations

import hashlib
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import time
from decimal import Decimal, ROUND_HALF_UP

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from restaurants.models import Category, OpeningHour, PriceRange, Restaurant

GOOGLE_TEXTSEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
GOOGLE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

GOOGLE_RESTAURANT_SLUG_PREFIX = "gm-"
GOOGLE_CATEGORY_SLUG_PREFIX = "gm-cat-"

DEFAULT_REGIONS = ["atasehir", "taksim", "kadikoy", "besiktas", "sariyer"]

TYPE_TO_CATEGORY = {
    "turkish_restaurant": "Turk Mutfagi",
    "kebab_shop": "Kebap",
    "seafood_restaurant": "Deniz Urunleri",
    "italian_restaurant": "Italyan",
    "japanese_restaurant": "Japon",
    "pizza_restaurant": "Pizza",
    "steak_house": "Steakhouse",
    "cafe": "Kafe",
    "bakery": "Firin",
    "restaurant": "Restoran",
}


@dataclass(frozen=True)
class PlaceCandidate:
    place_id: str
    name: str
    region: str
    rating: float
    ratings_total: int


class Command(BaseCommand):
    help = "Seed real Istanbul restaurants from Google Places API data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--total",
            type=int,
            default=25,
            help="Total number of restaurants to import.",
        )
        parser.add_argument(
            "--regions",
            default=",".join(DEFAULT_REGIONS),
            help="Comma-separated Istanbul regions to search.",
        )
        parser.add_argument(
            "--language",
            default="tr",
            help="Google Places language code.",
        )
        parser.add_argument(
            "--api-key",
            default="",
            help="Google Maps API key (fallback: GOOGLE_MAPS_API_KEY env var).",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previously imported Google-seeded restaurants first.",
        )
        parser.add_argument(
            "--timeout",
            type=int,
            default=20,
            help="HTTP timeout in seconds per request.",
        )

    def handle(self, *args, **options):
        total = options["total"]
        if total <= 0:
            raise CommandError("--total must be greater than 0.")

        regions = [
            part.strip() for part in options["regions"].split(",") if part.strip()
        ]
        if not regions:
            raise CommandError("At least one region is required.")

        api_key = options["api_key"].strip() or os.getenv("GOOGLE_MAPS_API_KEY", "")
        if not api_key:
            raise CommandError(
                "Google API key missing. Set GOOGLE_MAPS_API_KEY or pass --api-key."
            )

        language = options["language"].strip() or "tr"
        timeout = options["timeout"]

        candidates = self._collect_candidates(
            api_key=api_key,
            regions=regions,
            language=language,
            timeout=timeout,
        )
        selected = self._select_candidates(candidates=candidates, total=total)

        if not selected:
            raise CommandError("No restaurants were returned from Google Places.")

        with transaction.atomic():
            if options["reset"]:
                self._purge_google_seeded_data()

            created, updated = self._upsert_restaurants(
                candidates=selected,
                api_key=api_key,
                language=language,
                timeout=timeout,
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Google seed complete. "
                f"selected={len(selected)} created={created} updated={updated}"
            )
        )

    def _collect_candidates(
        self, *, api_key: str, regions, language: str, timeout: int
    ):
        deduped: dict[str, PlaceCandidate] = {}

        for region in regions:
            query = f"restoran {region} istanbul"
            payload = self._fetch_json(
                GOOGLE_TEXTSEARCH_URL,
                {
                    "query": query,
                    "language": language,
                    "region": "tr",
                    "key": api_key,
                },
                timeout=timeout,
            )

            status = payload.get("status")
            if status not in {"OK", "ZERO_RESULTS"}:
                raise CommandError(
                    f"Google text search failed for '{region}' with status={status}."
                )

            for result in payload.get("results", []):
                place_id = result.get("place_id", "")
                if not place_id:
                    continue

                candidate = PlaceCandidate(
                    place_id=place_id,
                    name=(result.get("name") or "Unnamed Restaurant").strip(),
                    region=region,
                    rating=float(result.get("rating") or 0),
                    ratings_total=int(result.get("user_ratings_total") or 0),
                )

                existing = deduped.get(place_id)
                if existing is None:
                    deduped[place_id] = candidate
                    continue

                if (
                    candidate.rating,
                    candidate.ratings_total,
                ) > (
                    existing.rating,
                    existing.ratings_total,
                ):
                    deduped[place_id] = candidate

        self.stdout.write(f"Google candidates collected: {len(deduped)}")
        return list(deduped.values())

    def _select_candidates(self, *, candidates, total: int):
        ranked = sorted(
            candidates,
            key=lambda item: (item.rating, item.ratings_total),
            reverse=True,
        )
        return ranked[:total]

    def _upsert_restaurants(
        self, *, candidates, api_key: str, language: str, timeout: int
    ):
        created_count = 0
        updated_count = 0

        for candidate in candidates:
            details_payload = self._fetch_json(
                GOOGLE_DETAILS_URL,
                {
                    "place_id": candidate.place_id,
                    "fields": (
                        "place_id,name,formatted_address,address_components,geometry,"
                        "types,rating,user_ratings_total,price_level,"
                        "website,international_phone_number,formatted_phone_number,"
                        "opening_hours"
                    ),
                    "language": language,
                    "region": "tr",
                    "key": api_key,
                },
                timeout=timeout,
            )

            status = details_payload.get("status")
            if status != "OK":
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping place_id={candidate.place_id}; details status={status}"
                    )
                )
                continue

            place = details_payload.get("result", {})
            slug = self._slug_for_place(candidate.place_id)
            category = self._resolve_category(place.get("types", []))

            address_components = place.get("address_components", [])
            city, district, postal_code = self._extract_address_components(
                address_components,
                fallback_region=candidate.region,
            )

            geometry = place.get("geometry", {}).get("location", {})
            latitude = self._to_decimal(geometry.get("lat"), quantizer="0.00000001")
            longitude = self._to_decimal(geometry.get("lng"), quantizer="0.00000001")

            rating = self._to_decimal(
                place.get("rating", candidate.rating), quantizer="0.01"
            ) or Decimal("0.00")
            review_count = int(
                place.get("user_ratings_total", candidate.ratings_total) or 0
            )

            phone = self._normalize_phone(
                place.get("international_phone_number")
                or place.get("formatted_phone_number")
                or ""
            )

            restaurant, created = Restaurant.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": place.get("name") or candidate.name,
                    "description": (
                        "Google Places kaynakli otomatik restoran verisi. "
                        f"place_id={candidate.place_id}"
                    ),
                    "phone": phone,
                    "website": place.get("website", "")[:200],
                    "category": category,
                    "owner": None,
                    "address_line1": (place.get("formatted_address") or "")[:255],
                    "address_line2": "",
                    "city": city,
                    "district": district,
                    "postal_code": postal_code,
                    "latitude": latitude,
                    "longitude": longitude,
                    "price_range": self._map_price_level(place.get("price_level")),
                    "average_rating": rating,
                    "review_count": review_count,
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

            self._sync_opening_hours(
                restaurant=restaurant,
                periods=(place.get("opening_hours") or {}).get("periods", []),
            )

        return created_count, updated_count

    def _resolve_category(self, place_types):
        label = "Restoran"
        for place_type in place_types:
            mapped = TYPE_TO_CATEGORY.get(place_type)
            if mapped:
                label = mapped
                break

        existing = Category.objects.filter(name=label).first()
        if existing:
            return existing

        slug = f"{GOOGLE_CATEGORY_SLUG_PREFIX}{slugify(label)}"
        category, _ = Category.objects.get_or_create(
            slug=slug,
            defaults={
                "name": label,
                "description": "Google Places kategorisi",
                "icon_url": "",
                "sort_order": 0,
            },
        )
        return category

    def _sync_opening_hours(self, *, restaurant: Restaurant, periods):
        OpeningHour.objects.filter(restaurant=restaurant).delete()
        if not periods:
            return

        by_day: dict[int, tuple[time | None, time | None]] = {}

        for period in periods:
            open_info = period.get("open") or {}
            close_info = period.get("close") or {}

            google_day = open_info.get("day")
            open_raw = open_info.get("time")
            if google_day is None or not open_raw:
                continue

            local_day = (int(google_day) - 1) % 7
            open_time = self._parse_hhmm(open_raw)
            close_time = None

            close_day = close_info.get("day")
            close_raw = close_info.get("time")
            if (
                close_day is not None
                and int(close_day) == int(google_day)
                and close_raw
            ):
                close_time = self._parse_hhmm(close_raw)

            existing = by_day.get(local_day)
            if existing is None:
                by_day[local_day] = (open_time, close_time)
                continue

            existing_open, _ = existing
            if existing_open is None or (open_time and open_time < existing_open):
                by_day[local_day] = (open_time, close_time)

        for day in range(7):
            if day not in by_day:
                OpeningHour.objects.create(
                    restaurant=restaurant,
                    day_of_week=day,
                    open_time=None,
                    close_time=None,
                    is_closed=True,
                )
                continue

            open_time, close_time = by_day[day]
            OpeningHour.objects.create(
                restaurant=restaurant,
                day_of_week=day,
                open_time=open_time,
                close_time=close_time,
                is_closed=False,
            )

    def _extract_address_components(self, components, *, fallback_region: str):
        city = self._address_component(components, "administrative_area_level_1")
        district = self._address_component(components, "administrative_area_level_2")
        if not district:
            district = self._address_component(components, "sublocality_level_1")
        postal_code = self._address_component(components, "postal_code")

        return (
            (city or "Istanbul")[:100],
            (district or fallback_region.title())[:100],
            (postal_code or "")[:20],
        )

    def _address_component(self, components, target_type: str):
        for component in components:
            types = component.get("types", [])
            if target_type in types:
                return component.get("long_name", "")
        return ""

    def _slug_for_place(self, place_id: str):
        digest = hashlib.sha1(place_id.encode("utf-8")).hexdigest()[:20]
        return f"{GOOGLE_RESTAURANT_SLUG_PREFIX}{digest}"

    def _map_price_level(self, price_level):
        if price_level in {0, 1}:
            return PriceRange.LOW
        if price_level == 2:
            return PriceRange.MEDIUM
        if price_level in {3, 4}:
            return PriceRange.HIGH
        return PriceRange.MEDIUM

    def _parse_hhmm(self, value: str):
        if len(value) != 4 or not value.isdigit():
            return None
        hour = int(value[:2])
        minute = int(value[2:])
        if hour > 23 or minute > 59:
            return None
        return time(hour=hour, minute=minute)

    def _normalize_phone(self, value: str):
        if not value:
            return ""

        normalized = re.sub(r"[^0-9+]", "", value)
        if "+" in normalized and not normalized.startswith("+"):
            normalized = normalized.replace("+", "")
        if normalized.count("+") > 1:
            normalized = "+" + normalized.replace("+", "")
        return normalized[:20]

    def _to_decimal(self, value, *, quantizer: str):
        if value is None:
            return None
        return Decimal(str(value)).quantize(
            Decimal(quantizer),
            rounding=ROUND_HALF_UP,
        )

    def _fetch_json(self, base_url: str, params: dict[str, str], *, timeout: int):
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        request = urllib.request.Request(
            url, headers={"User-Agent": "FlavorMapSeeder/1.0"}
        )

        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                content = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            raise CommandError(
                f"Google request failed with HTTP {exc.code}: {url}"
            ) from exc
        except urllib.error.URLError as exc:
            raise CommandError(f"Google request failed: {exc.reason}") from exc

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise CommandError("Google response was not valid JSON.") from exc

    def _purge_google_seeded_data(self):
        Restaurant.objects.filter(
            slug__startswith=GOOGLE_RESTAURANT_SLUG_PREFIX
        ).delete()
        Category.objects.filter(slug__startswith=GOOGLE_CATEGORY_SLUG_PREFIX).delete()
        self.stdout.write("Removed existing Google-seeded restaurants.")
