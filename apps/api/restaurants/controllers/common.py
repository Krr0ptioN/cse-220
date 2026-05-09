
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter

pagination_and_filter_parameters = [
    OpenApiParameter(
        "page",
        OpenApiTypes.INT,
        description="A page number within the paginated result set.",
    ),
    OpenApiParameter(
        "page_size",
        OpenApiTypes.INT,
        description="Number of results to return per page.",
    ),
    OpenApiParameter(
        "include",
        OpenApiTypes.STR,
        description="Comma-separated list of fields to include in the response.",
    ),
    OpenApiParameter(
        "with",
        OpenApiTypes.STR,
        description="Comma-separated list of relations to expand.",
    ),
    OpenApiParameter(
        "omit",
        OpenApiTypes.STR,
        description="Comma-separated list of fields to exclude from the response.",
    ),
    OpenApiParameter(
        "price",
        OpenApiTypes.STR,
        description="Filter restaurants by price range: 1, 2, or 3.",
    ),
    OpenApiParameter(
        "price_range",
        OpenApiTypes.STR,
        description="Alias for price. Filter restaurants by price range: 1, 2, or 3.",
    ),
    OpenApiParameter(
        "min_rating",
        OpenApiTypes.NUMBER,
        description="Filter restaurants with average rating greater than or equal to this value.",
    ),
]
