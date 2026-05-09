import {
  ApiEnvelope,
  FavoriteRestaurant,
  FavoriteRestaurantMutationResponse,
  FavoriteRestaurantsFilters,
  PaginatedResponse,
} from "../contracts";

const DEFAULT_API_BASE_URL = "http://localhost:8020";
let cachedCsrfToken: string | null = null;
let pendingCsrfTokenPromise: Promise<string> | null = null;

type FavoriteRestaurantsPayload =
  | ApiEnvelope<FavoriteRestaurant[] | PaginatedResponse<FavoriteRestaurant>>
  | FavoriteRestaurant[]
  | PaginatedResponse<FavoriteRestaurant>;

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    DEFAULT_API_BASE_URL
  );
}

function buildFavoriteRestaurantsUrl(filters?: FavoriteRestaurantsFilters) {
  const query = buildQueryParams(filters);
  return `${getApiBaseUrl()}/api/v1/restaurants/favorites/${
    query ? `?${query}` : ""
  }`;
}

function buildFavoriteRestaurantUrl(restaurantSlug: string) {
  return `${getApiBaseUrl()}/api/v1/restaurants/${restaurantSlug}/favorite/`;
}

function buildQueryParams(filters?: FavoriteRestaurantsFilters) {
  const params = new URLSearchParams();

  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export async function getFavoriteRestaurants(
  filters?: FavoriteRestaurantsFilters,
): Promise<FavoriteRestaurant[]> {
  const response = await fetch(buildFavoriteRestaurantsUrl(filters), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch favorite restaurants");
  }

  const payload = (await response.json()) as FavoriteRestaurantsPayload;

  return normalizeFavoriteRestaurantsPayload(payload);
}

export async function favoriteRestaurant(
  restaurantSlug: string,
): Promise<FavoriteRestaurantMutationResponse> {
  return mutateFavoriteRestaurant(restaurantSlug, "POST");
}

export async function unfavoriteRestaurant(
  restaurantSlug: string,
): Promise<FavoriteRestaurantMutationResponse> {
  return mutateFavoriteRestaurant(restaurantSlug, "DELETE");
}

async function mutateFavoriteRestaurant(
  restaurantSlug: string,
  method: "POST" | "DELETE",
): Promise<FavoriteRestaurantMutationResponse> {
  const headers = new Headers({
    Accept: "application/json",
  });
  headers.set("X-CSRFToken", await fetchCsrfToken());

  const response = await fetch(buildFavoriteRestaurantUrl(restaurantSlug), {
    method,
    credentials: "include",
    headers,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<FavoriteRestaurantMutationResponse>
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? "Failed to update favorite restaurant",
    );
  }

  return payload?.data as FavoriteRestaurantMutationResponse;
}

async function fetchCsrfToken(): Promise<string> {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  if (pendingCsrfTokenPromise) {
    return pendingCsrfTokenPromise;
  }

  pendingCsrfTokenPromise = (async () => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/csrf/`, {
      credentials: "include",
    });

    const payload = (await response.json().catch(() => null)) as
      | ApiEnvelope<{ csrf_token?: string }>
      | null;

    if (!response.ok || !payload?.data?.csrf_token) {
      throw new Error("Unable to start a secure session. Please try again.");
    }

    cachedCsrfToken = payload.data.csrf_token;
    return payload.data.csrf_token;
  })();

  try {
    return await pendingCsrfTokenPromise;
  } finally {
    pendingCsrfTokenPromise = null;
  }
}

export function __resetFavoriteMutationStateForTests() {
  cachedCsrfToken = null;
  pendingCsrfTokenPromise = null;
}

function normalizeFavoriteRestaurantsPayload(
  payload: FavoriteRestaurantsPayload,
): FavoriteRestaurant[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeFavoriteRestaurant(item))
      .filter((item): item is FavoriteRestaurant => item !== null);
  }

  if (Array.isArray(payload.data)) {
    return payload.data
      .map((item) => normalizeFavoriteRestaurant(item))
      .filter((item): item is FavoriteRestaurant => item !== null);
  }

  if (isPaginatedFavoriteRestaurants(payload.data)) {
    const items = payload.data.results ?? payload.data.data ?? [];
    return items
      .map((item) => normalizeFavoriteRestaurant(item))
      .filter((item): item is FavoriteRestaurant => item !== null);
  }

  if (isPaginatedFavoriteRestaurants(payload)) {
    const items = payload.results ?? payload.data ?? [];
    return items
      .map((item) => normalizeFavoriteRestaurant(item))
      .filter((item): item is FavoriteRestaurant => item !== null);
  }

  return [];
}

function normalizeFavoriteRestaurant(
  item: unknown,
): FavoriteRestaurant | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }

  const candidate = item as Partial<FavoriteRestaurant> & {
    restaurant?: Partial<FavoriteRestaurant>;
  };
  const source = candidate.restaurant ?? candidate;
  const slug = source.slug?.trim();
  const name = source.name?.trim();

  if (!slug || !name) {
    return null;
  }

  return {
    id: source.id?.trim() || slug,
    name,
    slug,
    description: source.description ?? "",
    phone: source.phone,
    website: source.website,
    categories: source.categories,
    opening_hours: source.opening_hours,
    favorite_count: source.favorite_count,
    favorite_score: source.favorite_score,
    last_favorited_at: source.last_favorited_at ?? null,
    is_favorite: source.is_favorite,
    primary_photo_url: source.primary_photo_url,
    address_line1: source.address_line1,
    address_line2: source.address_line2,
    city: source.city,
    district: source.district,
    postal_code: source.postal_code,
    latitude: source.latitude,
    longitude: source.longitude,
    price_range: source.price_range,
    average_rating: source.average_rating,
    review_count: source.review_count,
    created_at: source.created_at,
    updated_at: source.updated_at,
  };
}

function isPaginatedFavoriteRestaurants(
  value: unknown,
): value is PaginatedResponse<FavoriteRestaurant> {
  return (
    typeof value === "object" &&
    value !== null &&
    ("pagination" in value || "results" in value || "count" in value)
  );
}
