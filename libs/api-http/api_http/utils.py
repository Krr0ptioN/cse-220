"""Small path utilities used by the route builder."""


def normalize_path(path_value: str) -> str:
    """Normalize path fragments by removing leading slash and outer spaces."""

    return path_value.strip().lstrip("/")


def join_paths(prefix: str, route: str) -> str:
    """Join controller prefix and route fragment into a Django path string."""

    normalized_prefix = normalize_path(prefix)
    normalized_route = normalize_path(route)

    if normalized_prefix and normalized_route:
        return f"{normalized_prefix.rstrip('/')}/{normalized_route}"
    if normalized_prefix:
        if normalized_prefix.endswith("/"):
            return normalized_prefix
        return f"{normalized_prefix}/"
    return normalized_route
