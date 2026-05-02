"""Seed Istanbul restaurants by scraping Google Maps web pages."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import tempfile
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from restaurants.models import Category, PriceRange, Restaurant

GOOGLE_RESTAURANT_SLUG_PREFIX = "gm-"
GOOGLE_CATEGORY_SLUG_PREFIX = "gm-cat-"
DEFAULT_DATA_FILE = "data/istanbul_restaurants_seed.json"

DEFAULT_REGIONS = ["atasehir", "taksim", "kadikoy", "besiktas", "sariyer"]


class Command(BaseCommand):
    help = "Seed Istanbul restaurants from Google Maps web scraping (no API key)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--total",
            type=int,
            default=25,
            help="Total restaurants to import from scraping.",
        )
        parser.add_argument(
            "--regions",
            default=",".join(DEFAULT_REGIONS),
            help="Comma-separated regions for Google Maps searches.",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previously imported Google-seeded restaurants first.",
        )
        parser.add_argument(
            "--headful",
            action="store_true",
            help="Run Playwright in headed mode for debugging.",
        )
        parser.add_argument(
            "--data-file",
            default=DEFAULT_DATA_FILE,
            help="Reusable JSON dataset file path (relative to apps/api if not absolute).",
        )
        parser.add_argument(
            "--refresh-data",
            action="store_true",
            help="Force a fresh scrape and overwrite --data-file before seeding.",
        )
        parser.add_argument(
            "--report-dir",
            default="reports/google-scrape",
            help="Directory where JSON/Markdown scrape reports are written.",
        )
        parser.add_argument(
            "--skip-report",
            action="store_true",
            help="Skip writing report files.",
        )

    def handle(self, *args, **options):
        total = int(options["total"])
        if total <= 0:
            raise CommandError("--total must be greater than 0.")

        regions = [
            part.strip() for part in options["regions"].split(",") if part.strip()
        ]
        if not regions:
            raise CommandError("At least one region is required.")

        api_root = Path(__file__).resolve().parents[3]
        data_file = self._resolve_path(api_root, options["data_file"])

        self.stdout.write(self.style.NOTICE("Google Maps scraping seed started"))
        self.stdout.write(f"- regions: {', '.join(regions)}")
        self.stdout.write(f"- requested total: {total}")

        if options["refresh_data"] or not data_file.exists():
            scraped_payload = self._run_scraper(
                total=total,
                regions=regions,
                headful=options["headful"],
            )
            self._save_data_file(data_file=data_file, payload=scraped_payload)
            data_source = "scrape"
            self.stdout.write(f"- data source: fresh scrape -> {data_file}")
        else:
            scraped_payload = self._load_data_file(data_file)
            data_source = "cache"
            self.stdout.write(f"- data source: cached file -> {data_file}")

        places = scraped_payload.get("places") or []
        if not places:
            raise CommandError("Scraper returned no places.")

        selected_places = places[:total]
        if len(selected_places) < total:
            self.stdout.write(
                self.style.WARNING(
                    "Requested total is greater than cached dataset size. "
                    f"requested={total}, available={len(places)}"
                )
            )

        with transaction.atomic():
            if options["reset"]:
                self._purge_google_seeded_data()

            created, updated, skipped, imported_rows = self._upsert_places(
                selected_places
            )

        report_paths = None
        if not options["skip_report"]:
            report_paths = self._write_reports(
                report_dir=options["report_dir"],
                scraped_payload=scraped_payload,
                imported_rows=imported_rows,
                requested_total=total,
                seeded_total=len(selected_places),
                created=created,
                updated=updated,
                skipped=skipped,
                data_source=data_source,
                data_file=data_file,
            )

        self._print_report_summary(
            requested_total=total,
            scraped_total=len(places),
            seeded_total=len(selected_places),
            created=created,
            updated=updated,
            skipped=skipped,
            imported_rows=imported_rows,
            report_paths=report_paths,
        )

    def _run_scraper(self, *, total: int, regions, headful: bool):
        api_root = Path(__file__).resolve().parents[3]
        script_path = api_root / "scripts" / "scrape_google_maps.mjs"

        if not script_path.exists():
            raise CommandError(f"Scraper script not found: {script_path}")

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp_file:
            output_path = Path(tmp_file.name)

        command = [
            "node",
            str(script_path),
            "--total",
            str(total),
            "--regions",
            ",".join(regions),
            "--out",
            str(output_path),
        ]
        if headful:
            command.append("--headful")

        result = subprocess.run(
            command,
            cwd=api_root,
            capture_output=True,
            text=True,
            check=False,
        )

        if result.stdout:
            for line in result.stdout.splitlines():
                self.stdout.write(f"SCRAPER | {line}")

        if result.returncode != 0:
            stderr = (result.stderr or "").strip()
            raise CommandError(f"Scraper failed: {stderr or 'unknown error'}")

        try:
            payload = json.loads(output_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError("Scraper output is not valid JSON.") from exc
        finally:
            output_path.unlink(missing_ok=True)

        return payload

    def _resolve_path(self, api_root: Path, raw_path: str):
        candidate = Path(raw_path)
        if candidate.is_absolute():
            return candidate
        return api_root / candidate

    def _save_data_file(self, *, data_file: Path, payload):
        data_file.parent.mkdir(parents=True, exist_ok=True)
        data_file.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _load_data_file(self, data_file: Path):
        try:
            content = data_file.read_text(encoding="utf-8")
            payload = json.loads(content)
        except FileNotFoundError as exc:
            raise CommandError(f"Data file not found: {data_file}") from exc
        except json.JSONDecodeError as exc:
            raise CommandError(f"Data file is not valid JSON: {data_file}") from exc

        if not isinstance(payload, dict):
            raise CommandError(f"Data file format is invalid: {data_file}")

        return payload

    def _upsert_places(self, places):
        created_count = 0
        updated_count = 0
        skipped_count = 0
        imported_rows = []

        for place in places:
            source_url = (place.get("source_url") or "").strip()
            name = (place.get("name") or "").strip()
            if not source_url or not name:
                skipped_count += 1
                continue

            slug = self._slug_for_source(source_url)
            category = self._resolve_category((place.get("category") or "").strip())

            city, district, postal_code = self._extract_city_district_postal(
                address=(place.get("address") or "").strip(),
                fallback_region=(place.get("region") or "").strip(),
            )

            rating = self._to_decimal(place.get("rating"), quantizer="0.01")
            if rating is None:
                rating = Decimal("0.00")

            latitude = self._to_decimal(place.get("lat"), quantizer="0.00000001")
            longitude = self._to_decimal(place.get("lng"), quantizer="0.00000001")

            restaurant, created = Restaurant.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": (
                        "Google Maps web scraping ile otomatik eklenen restoran verisi. "
                        f"source={source_url}"
                    ),
                    "phone": self._normalize_phone((place.get("phone") or "")),
                    "website": (place.get("website") or "")[:200],
                    "category": category,
                    "owner": None,
                    "address_line1": (place.get("address") or "")[:255],
                    "address_line2": "",
                    "city": city,
                    "district": district,
                    "postal_code": postal_code,
                    "latitude": latitude,
                    "longitude": longitude,
                    "price_range": PriceRange.MEDIUM,
                    "average_rating": rating,
                    "review_count": int(place.get("review_count") or 0),
                },
            )

            status = "created" if created else "updated"
            if created:
                created_count += 1
            else:
                updated_count += 1

            imported_rows.append(
                {
                    "status": status,
                    "name": restaurant.name,
                    "region": (place.get("region") or "").strip(),
                    "city": restaurant.city,
                    "district": restaurant.district,
                    "rating": str(restaurant.average_rating),
                    "review_count": restaurant.review_count,
                    "phone": restaurant.phone,
                    "website": restaurant.website,
                    "source_url": source_url,
                }
            )

        return created_count, updated_count, skipped_count, imported_rows

    def _resolve_category(self, raw_category: str):
        category_name = raw_category or "Restoran"

        existing = Category.objects.filter(name=category_name).first()
        if existing:
            return existing

        slug = f"{GOOGLE_CATEGORY_SLUG_PREFIX}{slugify(category_name)}"
        category, _ = Category.objects.get_or_create(
            slug=slug,
            defaults={
                "name": category_name,
                "description": "Google Maps scraping kategorisi",
                "icon_url": "",
                "sort_order": 0,
            },
        )
        return category

    def _slug_for_source(self, source_url: str):
        digest = hashlib.sha1(source_url.encode("utf-8")).hexdigest()[:20]
        return f"{GOOGLE_RESTAURANT_SLUG_PREFIX}{digest}"

    def _extract_city_district_postal(self, *, address: str, fallback_region: str):
        city = "Istanbul"
        district = fallback_region.title() if fallback_region else "Istanbul"
        postal_code = ""

        postal_match = re.search(r"\b\d{5}\b", address)
        if postal_match:
            postal_code = postal_match.group(0)

        city_match = re.search(
            r"([A-Za-zÇĞİÖŞÜçğıöşü-]+)\s*/\s*([A-Za-zÇĞİÖŞÜçğıöşü-]+)\s*$", address
        )
        if city_match:
            district = city_match.group(1)
            city = city_match.group(2)

        return city[:100], district[:100], postal_code[:20]

    def _normalize_phone(self, phone: str):
        normalized = re.sub(r"[^0-9+]", "", phone or "")
        if "+" in normalized and not normalized.startswith("+"):
            normalized = normalized.replace("+", "")
        if normalized.count("+") > 1:
            normalized = "+" + normalized.replace("+", "")
        return normalized[:20]

    def _to_decimal(self, value, *, quantizer: str):
        if value is None or value == "":
            return None
        try:
            return Decimal(str(value)).quantize(
                Decimal(quantizer),
                rounding=ROUND_HALF_UP,
            )
        except Exception:
            return None

    def _purge_google_seeded_data(self):
        Restaurant.objects.filter(
            slug__startswith=GOOGLE_RESTAURANT_SLUG_PREFIX
        ).delete()
        Category.objects.filter(slug__startswith=GOOGLE_CATEGORY_SLUG_PREFIX).delete()
        self.stdout.write("Removed existing Google-seeded restaurants.")

    def _write_reports(
        self,
        *,
        report_dir: str,
        scraped_payload,
        imported_rows,
        requested_total: int,
        seeded_total: int,
        created: int,
        updated: int,
        skipped: int,
        data_source: str,
        data_file: Path,
    ):
        api_root = Path(__file__).resolve().parents[3]
        report_root = Path(report_dir)
        if not report_root.is_absolute():
            report_root = api_root / report_root
        report_root.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
        json_path = report_root / f"google-scrape-{timestamp}.json"
        md_path = report_root / f"google-scrape-{timestamp}.md"

        report_payload = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "data_source": data_source,
            "data_file": str(data_file),
            "requested_total": requested_total,
            "scraped_total": len(scraped_payload.get("places") or []),
            "seeded_total": seeded_total,
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "regions": scraped_payload.get("regions") or [],
            "scraper_summary": scraped_payload.get("summary") or {},
            "restaurants": imported_rows,
        }
        json_path.write_text(
            json.dumps(report_payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        md_lines = [
            "# Istanbul Google Scrape Report",
            "",
            "## Summary",
            f"- Generated at: `{report_payload['generated_at']}`",
            f"- Data source: `{data_source}`",
            f"- Data file: `{data_file}`",
            f"- Requested total: `{requested_total}`",
            f"- Scraped total: `{report_payload['scraped_total']}`",
            f"- Seeded total: `{seeded_total}`",
            f"- Created: `{created}`",
            f"- Updated: `{updated}`",
            f"- Skipped: `{skipped}`",
            f"- Regions: `{', '.join(report_payload['regions'])}`",
            "",
            "## Restaurants",
            "| # | Status | Name | Region | District | Rating | Reviews | Phone | Website |",
            "|---:|---|---|---|---|---:|---:|---|---|",
        ]

        for index, row in enumerate(imported_rows, start=1):
            md_lines.append(
                "| {idx} | {status} | {name} | {region} | {district} | {rating} | {reviews} | {phone} | {website} |".format(
                    idx=index,
                    status=self._escape_md_cell(row.get("status", "")),
                    name=self._escape_md_cell(row.get("name", "")),
                    region=self._escape_md_cell(row.get("region", "")),
                    district=self._escape_md_cell(row.get("district", "")),
                    rating=self._escape_md_cell(row.get("rating", "")),
                    reviews=self._escape_md_cell(str(row.get("review_count", 0))),
                    phone=self._escape_md_cell(row.get("phone", "")),
                    website=self._escape_md_cell(row.get("website", "")),
                )
            )

        md_path.write_text("\n".join(md_lines), encoding="utf-8")
        return {"json": json_path, "markdown": md_path}

    def _escape_md_cell(self, value: str):
        return (value or "").replace("|", "\\|").replace("\n", " ").strip()

    def _print_report_summary(
        self,
        *,
        requested_total: int,
        scraped_total: int,
        seeded_total: int,
        created: int,
        updated: int,
        skipped: int,
        imported_rows,
        report_paths,
    ):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Google scrape seed complete"))
        self.stdout.write(f"- requested: {requested_total}")
        self.stdout.write(f"- scraped: {scraped_total}")
        self.stdout.write(f"- seeded: {seeded_total}")
        self.stdout.write(f"- created: {created}")
        self.stdout.write(f"- updated: {updated}")
        self.stdout.write(f"- skipped: {skipped}")

        self.stdout.write("")
        self.stdout.write("Top imported restaurants:")
        for index, row in enumerate(imported_rows[:10], start=1):
            self.stdout.write(
                "{idx:02d}. {name} | {district}/{city} | rating={rating} | reviews={reviews}".format(
                    idx=index,
                    name=row.get("name", ""),
                    district=row.get("district", ""),
                    city=row.get("city", ""),
                    rating=row.get("rating", "0.00"),
                    reviews=row.get("review_count", 0),
                )
            )

        if len(imported_rows) > 10:
            self.stdout.write(f"... and {len(imported_rows) - 10} more")

        if report_paths:
            self.stdout.write("")
            self.stdout.write("Report files:")
            self.stdout.write(f"- JSON: {report_paths['json']}")
            self.stdout.write(f"- Markdown: {report_paths['markdown']}")
