from decimal import Decimal

from api.google_maps_seed import normalize_google_place


def test_normalize_google_place_extracts_coordinates_from_source_url():
    place = normalize_google_place(
        {
            "source_url": "https://www.google.com/maps/place/Demo/data=!4m7!3m6!1s0x0:0x0!8m2!3d41.0353996!4d28.9812384!16s%2Fg%2F11ny484k07",
            "name": "Demo Restaurant",
            "region": "taksim",
            "category": "Restoran",
            "address": "Kocatepe, Beyoğlu/İstanbul",
            "phone": "+90 212 555 12 34",
            "website": "https://example.com",
            "rating": 4.8,
            "review_count": 321,
        }
    )

    assert place["latitude"] == Decimal("41.03539960")
    assert place["longitude"] == Decimal("28.98123840")
    assert place["city"] == "İstanbul"
    assert place["district"] == "Kocatepe"


def test_normalize_google_place_uses_payload_coordinates_when_present():
    place = normalize_google_place(
        {
            "source_url": "https://www.google.com/maps/place/Demo/data=!4m7!3m6!1s0x0:0x0!8m2!3d41.0000000!4d29.0000000",
            "name": "Demo Restaurant",
            "region": "kadikoy",
            "category": "Kafe",
            "address": "Moda, Kadıköy/İstanbul",
            "phone": "",
            "website": "",
            "rating": 4.2,
            "review_count": None,
            "lat": 40.9999999,
            "lng": 29.1234567,
        }
    )

    assert place["latitude"] == Decimal("40.99999990")
    assert place["longitude"] == Decimal("29.12345670")
    assert place["category"] == "Kafe"
