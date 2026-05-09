from restaurants.models import Restaurant


class RestaurantQueryBuilder:
    def __init__(self, queryset=None):
        self.queryset = queryset or Restaurant.objects.all()

    def with_related(self):
        self.queryset = self.queryset.prefetch_related(
            "categories",
            "opening_hours",
        )
        return self

    def favorites_for_user(self, user):
        self.queryset = self.queryset.filter(
            favorited_by__user=user
        )
        return self

    def apply_filters(self, filters: dict | None = None):
        filters = filters or {}

        category = filters.get("category")
        city = filters.get("city")
        price_range = filters.get("price_range")
        min_rating = filters.get("min_rating")

        if category:
            self.queryset = self.queryset.filter(
                categories__slug=category
            )

        if city:
            self.queryset = self.queryset.filter(
                city__iexact=city
            )

        if price_range:
            self.queryset = self.queryset.filter(
                price_range=price_range
            )

        if min_rating is not None:
            self.queryset = self.queryset.filter(
                average_rating__gte=min_rating
            )

        if category:
            self.queryset = self.queryset.distinct()

        return self

    def apply_sort(self, sort: str | None = None):
        SORT_MAP = {
            "rating": ["-average_rating", "-review_count"],
            "newest": ["-created_at"],
            "oldest": ["created_at"],
            "name": ["name"],
            "price_low": ["price_range"],
            "price_high": ["-price_range"],
        }

        if sort in SORT_MAP:
            self.queryset = self.queryset.order_by(
                *SORT_MAP[sort]
            )

        return self

    def build(self):
        return self.queryset
