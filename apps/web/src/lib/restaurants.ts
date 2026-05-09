import { env } from './env';

export type RestaurantCategory = {
  id?: string;
  name?: string;
  slug?: string;
};

export type RestaurantOpeningHour = {
  id?: string;
  day_of_week: number;
  day_display?: string;
  display_day?: string;
  open_time?: string | null;
  close_time?: string | null;
  is_closed: boolean;
};

export type RestaurantStatus = {
  state: 'open' | 'closing-soon' | 'closed' | 'unknown';
  label: string;
  detail: string;
  minutesUntilClose?: number;
};

export type RestaurantPhoto = {
  id: string;
  url: string;
  caption?: string;
  sort_order?: number;
  is_primary?: boolean;
  created_at?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  city?: string;
  district?: string;
  address_line1?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone?: string;
  average_rating?: number;
  review_count?: number;
  price_range?: string;
  category?: RestaurantCategory;
  categories?: RestaurantCategory[];
  opening_hours?: RestaurantOpeningHour[];
  favorite_count?: number;
  favorite_score?: number;
  last_favorited_at?: string | null;
  is_favorite?: boolean;
  primary_photo_url?: string;
  photos?: RestaurantPhoto[];
};

export type MenuItem = {
  id: string;
  restaurant_id?: string;
  name: string;
  description?: string;
  category?: RestaurantCategory;
  price: number;
  currency: string;
  image_url?: string;
  is_available: boolean;
  sort_order: number;
};

export type User = {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  role: 'user' | 'owner' | 'admin';
  created_at?: string;
  updated_at?: string;
};

export type PaginationMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type RestaurantsResponse = {
  data: Restaurant[];
  pagination: PaginationMeta;
};

export type OwnerDashboardSummary = {
  restaurant_count: number;
  review_count: number;
  reviewer_count: number;
  average_rating: number | null;
  favorite_count?: number;
  favorite_score?: number;
};

export type OwnerDashboardReviewerStats = {
  id: string;
  username: string;
  display_name: string;
  review_count: number;
  average_rating: number | null;
  restaurant_count: number;
  first_review_at: string | null;
  last_review_at: string | null;
};

export type OwnerDashboardRatingProgressPoint = {
  month: string;
  review_count: number;
  average_rating: number | null;
  cumulative_review_count: number;
  cumulative_average_rating: number | null;
};

export type OwnerDashboardRestaurant = Omit<Restaurant, 'average_rating' | 'review_count'> & {
  average_rating: number | null;
  review_count: number;
  reviewer_stats: OwnerDashboardReviewerStats[];
  rating_progress: OwnerDashboardRatingProgressPoint[];
};

export type OwnerDashboardResponse = {
  summary: OwnerDashboardSummary;
  restaurants: OwnerDashboardRestaurant[];
  reviewers: OwnerDashboardReviewerStats[];
};

export function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim()) {
    return normalizeClientApiBaseUrl(configuredBaseUrl.replace(/\/$/, ''));
  }

  return normalizeClientApiBaseUrl(env.apiBaseUrl);
}

function normalizeClientApiBaseUrl(baseUrl: string): string {
  if (typeof window === 'undefined') {
    return baseUrl;
  }

  const browserHost = window.location.hostname;
  if (browserHost === 'localhost' || browserHost === '127.0.0.1') {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = browserHost;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    return baseUrl;
  }

  return baseUrl;
}

export const API_ENDPOINTS = {
  restaurants: {
    list: () => `${getApiBaseUrl()}/api/v1/restaurants/`,
    homepage: () => `${getApiBaseUrl()}/api/v1/restaurants/homepage/`,
    mine: () => `${getApiBaseUrl()}/api/v1/restaurants/mine/`,
    dashboard: () => `${getApiBaseUrl()}/api/v1/restaurants/mine/dashboard/`,
    detail: (slug: string) => `${getApiBaseUrl()}/api/v1/restaurants/${slug}/`,
    create: () => `${getApiBaseUrl()}/api/v1/restaurants/`,
    update: (slug: string) => `${getApiBaseUrl()}/api/v1/restaurants/${slug}/`,
    delete: (slug: string) => `${getApiBaseUrl()}/api/v1/restaurants/${slug}/`,
    menuItems: (slug: string) =>
      `${getApiBaseUrl()}/api/v1/restaurants/${slug}/menu-items/`,
    menuItem: (slug: string, menuItemId: string) =>
      `${getApiBaseUrl()}/api/v1/restaurants/${slug}/menu-items/${menuItemId}/`,
    photos: (slug: string) => `${getApiBaseUrl()}/api/v1/restaurants/${slug}/photos/`,
    photo: (slug: string, photoId: string) =>
      `${getApiBaseUrl()}/api/v1/restaurants/${slug}/photos/${photoId}/`,
    primaryPhoto: (slug: string, photoId: string) =>
      `${getApiBaseUrl()}/api/v1/restaurants/${slug}/photos/${photoId}/primary/`,
  },
  auth: {
    csrf: () => `${getApiBaseUrl()}/api/v1/auth/csrf/`,
    register: () => `${getApiBaseUrl()}/api/v1/auth/register/`,
    login: () => `${getApiBaseUrl()}/api/v1/auth/login/`,
    logout: () => `${getApiBaseUrl()}/api/v1/auth/logout/`,
    me: () => `${getApiBaseUrl()}/api/v1/auth/me/`,
  },
  users: {
    me: () => `${getApiBaseUrl()}/api/v1/users/me/`,
    avatar: () => `${getApiBaseUrl()}/api/v1/users/me/avatar/`,
  },
  reviews: {
    list: (restaurantSlug: string) =>
      `${getApiBaseUrl()}/api/v1/restaurants/${restaurantSlug}/reviews/`,
    create: (restaurantSlug: string) =>
      `${getApiBaseUrl()}/api/v1/restaurants/${restaurantSlug}/reviews/`,
  },
  categories: {
    list: () => `${getApiBaseUrl()}/api/v1/categories/`,
  },
} as const;

export function buildRestaurantsUrl(
  page: number,
  pageSize: number,
  query?: string,
): string {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  const normalizedQuery = query?.trim();
  if (normalizedQuery) {
    params.set('search', normalizedQuery);
    params.set('q', normalizedQuery);
  }

  return `${API_ENDPOINTS.restaurants.list()}?${params.toString()}`;
}

export async function fetchRestaurantDetail(
  slug: string,
  cookieHeader?: string | null,
): Promise<Restaurant | null> {
  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/v1/restaurants/${slug}/`,
    {
      cache: 'no-store',
      headers,
      credentials: 'include',
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data?: Partial<Restaurant> };
  if (!payload?.data) {
    return null;
  }

  const categories = normalizeCategories(payload.data.categories);
  const category = payload.data.category ?? categories[0];

  return {
    id: payload.data.id ?? slug,
    slug,
    name: payload.data.name ?? slugToTitle(slug),
    description: payload.data.description,
    city: payload.data.city,
    district: payload.data.district,
    address_line1: payload.data.address_line1,
    website: payload.data.website,
    phone: payload.data.phone,
    latitude: toNumber(payload.data.latitude),
    longitude: toNumber(payload.data.longitude),
    average_rating: toNumber(payload.data.average_rating),
    review_count: toNumber(payload.data.review_count),
    price_range: payload.data.price_range,
    category,
    categories,
    opening_hours: normalizeOpeningHours(payload.data.opening_hours),
    favorite_count: toNonNegativeInt(payload.data.favorite_count),
    favorite_score: toNonNegativeInt(payload.data.favorite_score),
    last_favorited_at: payload.data.last_favorited_at ?? null,
    is_favorite: Boolean(payload.data.is_favorite),
    primary_photo_url: resolveApiAssetUrl(payload.data.primary_photo_url),
    photos: normalizeRestaurantPhotos(payload.data.photos),
  };
}

export async function fetchRestaurantMenuItems(
  slug: string,
): Promise<MenuItem[]> {
  try {
    const response = await fetch(API_ENDPOINTS.restaurants.menuItems(slug), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { data?: unknown };
    return normalizeMenuItems(payload.data);
  } catch {
    return [];
  }
}

export function normalizeRestaurantsResponse(
  payload: unknown,
): RestaurantsResponse {
  const fallback: RestaurantsResponse = {
    data: [],
    pagination: {
      page: 1,
      page_size: 12,
      total: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const candidate = payload as {
    data?: Partial<Restaurant>[];
    pagination?: Partial<PaginationMeta>;
  };

  const normalizedData = Array.isArray(candidate.data)
    ? candidate.data
        .map((item) => normalizeRestaurant(item))
        .filter((item): item is Restaurant => item !== null)
    : [];

  const candidatePagination = candidate.pagination;
  const page = Math.max(1, toNumber(candidatePagination?.page) ?? 1);
  const pageSize = Math.max(1, toNumber(candidatePagination?.page_size) ?? 12);
  const total = Math.max(
    0,
    toNumber(candidatePagination?.total) ?? normalizedData.length,
  );
  const totalPages = Math.max(
    1,
    toNumber(candidatePagination?.total_pages) ?? 1,
  );

  return {
    data: normalizedData,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages,
      has_next: Boolean(candidatePagination?.has_next),
      has_previous: Boolean(candidatePagination?.has_previous),
    },
  };
}

export function normalizeRestaurantPhotos(value: unknown): RestaurantPhoto[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Partial<RestaurantPhoto>;
      if (!candidate.id || !candidate.url) {
        return null;
      }

      return {
        id: String(candidate.id),
        url: resolveApiAssetUrl(candidate.url),
        caption: candidate.caption,
        sort_order: toNonNegativeInt(candidate.sort_order),
        is_primary: Boolean(candidate.is_primary),
        created_at: candidate.created_at,
      };
    })
    .filter((item): item is RestaurantPhoto => item !== null);
}

export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

const coverImages = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80',
];

export function getRestaurantCoverImage(seed: string): string {
  const hash = seededHash(seed);
  return coverImages[hash % coverImages.length];
}

export function getRestaurantDistanceKm(seed: string): number {
  const hash = seededHash(seed);
  return Math.round((((hash % 120) + 5) / 10) * 10) / 10;
}

export function getRestaurantIsOpen(seed: string): boolean {
  const hash = seededHash(seed);
  return hash % 4 !== 0;
}

export function getRestaurantImageUrl(
  restaurant: Pick<Restaurant, 'slug' | 'primary_photo_url' | 'photos'>,
): string {
  return (
    resolveApiAssetUrl(restaurant.photos?.find((photo) => photo.is_primary)?.url) ||
    resolveApiAssetUrl(restaurant.primary_photo_url) ||
    resolveApiAssetUrl(restaurant.photos?.[0]?.url) ||
    getRestaurantCoverImage(restaurant.slug)
  );
}

export function getRestaurantPhotoUrls(
  restaurant: Pick<Restaurant, 'slug' | 'primary_photo_url' | 'photos'>,
): string[] {
  const urls = [
    getRestaurantImageUrl(restaurant),
    ...(restaurant.photos ?? []).map((photo) => resolveApiAssetUrl(photo.url)),
  ].filter(Boolean);

  return Array.from(new Set(urls));
}

export function getRestaurantStatus(
  openingHours: RestaurantOpeningHour[] | undefined,
  now = new Date(),
): RestaurantStatus {
  const currentDay = (now.getDay() + 6) % 7;
  const todayHours = openingHours?.find(
    (hour) => hour.day_of_week === currentDay,
  );

  if (todayHours?.is_closed) {
    return {
      state: 'closed',
      label: 'Closed',
      detail: 'Closed today',
    };
  }

  if (!todayHours?.open_time || !todayHours.close_time) {
    return {
      state: 'unknown',
      label: 'Hours unavailable',
      detail: 'Opening hours are not available',
    };
  }

  const openAt = timeOnDate(now, todayHours.open_time);
  const closeAt = timeOnDate(now, todayHours.close_time);

  if (!openAt || !closeAt) {
    return {
      state: 'unknown',
      label: 'Hours unavailable',
      detail: 'Opening hours are not available',
    };
  }

  if (now < openAt) {
    return {
      state: 'closed',
      label: 'Closed',
      detail: `Opens at ${formatTime(todayHours.open_time)}`,
    };
  }

  if (now >= closeAt) {
    return {
      state: 'closed',
      label: 'Closed',
      detail: `Closed at ${formatTime(todayHours.close_time)}`,
    };
  }

  const minutesUntilClose = Math.max(
    0,
    Math.round((closeAt.getTime() - now.getTime()) / 60000),
  );

  if (minutesUntilClose <= 60) {
    return {
      state: 'closing-soon',
      label: 'Open',
      detail: `Closes at ${formatTime(todayHours.close_time)}`,
      minutesUntilClose,
    };
  }

  return {
    state: 'open',
    label: 'Open',
    detail: `Open until ${formatTime(todayHours.close_time)}`,
    minutesUntilClose,
  };
}

export function resolveApiAssetUrl(url?: string | null): string {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedUrl) || normalizedUrl.startsWith('data:')) {
    return normalizedUrl;
  }

  return new URL(normalizedUrl, getApiBaseUrl()).toString();
}

function seededHash(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function normalizeRestaurant(
  candidate: Partial<Restaurant>,
): Restaurant | null {
  if (!candidate.slug || !candidate.name) {
    return null;
  }

  const categories = normalizeCategories(candidate.categories);
  const category = candidate.category ?? categories[0];

  return {
    id: candidate.id ?? candidate.slug,
    name: candidate.name,
    slug: candidate.slug,
    description: candidate.description,
    city: candidate.city,
    district: candidate.district,
    address_line1: candidate.address_line1,
    website: candidate.website,
    phone: candidate.phone,
    latitude: toNumber(candidate.latitude),
    longitude: toNumber(candidate.longitude),
    average_rating: toNumber(candidate.average_rating),
    review_count: toNumber(candidate.review_count),
    price_range: candidate.price_range,
    category,
    categories,
    opening_hours: normalizeOpeningHours(candidate.opening_hours),
    favorite_count: toNonNegativeInt(candidate.favorite_count),
    favorite_score: toNonNegativeInt(candidate.favorite_score),
    last_favorited_at: candidate.last_favorited_at ?? null,
    is_favorite: Boolean(candidate.is_favorite),
    primary_photo_url: resolveApiAssetUrl(candidate.primary_photo_url),
  };
}

export function normalizeMenuItems(payload: unknown): MenuItem[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item) => normalizeMenuItem(item))
    .filter((item): item is MenuItem => item !== null)
    .sort(compareMenuItems);
}

function normalizeMenuItem(candidate: unknown): MenuItem | null {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return null;
  }

  const item = candidate as Partial<MenuItem>;
  if (!item.id || !item.name) {
    return null;
  }

  return {
    id: item.id,
    restaurant_id: item.restaurant_id,
    name: item.name,
    description: item.description,
    category: item.category,
    price: toNumber(item.price) ?? 0,
    currency: normalizeCurrency(item.currency),
    image_url: resolveApiAssetUrl(item.image_url),
    is_available: item.is_available !== false,
    sort_order: toNumber(item.sort_order) ?? 0,
  };
}

function compareMenuItems(first: MenuItem, second: MenuItem): number {
  if (first.sort_order !== second.sort_order) {
    return first.sort_order - second.sort_order;
  }

  return first.name.localeCompare(second.name);
}

function normalizeCategories(value: unknown): RestaurantCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (category): category is RestaurantCategory =>
      Boolean(category && typeof category === 'object' && !Array.isArray(category)),
  );
}

function normalizeOpeningHours(value: unknown): RestaurantOpeningHour[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRestaurantOpeningHour)
    .sort((first, second) => first.day_of_week - second.day_of_week);
}

function isRestaurantOpeningHour(item: unknown): item is RestaurantOpeningHour {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return false;
  }

  const candidate = item as Partial<RestaurantOpeningHour>;
  const dayOfWeek = candidate.day_of_week;
  if (typeof dayOfWeek !== 'number' || !Number.isInteger(dayOfWeek)) {
    return false;
  }

  return dayOfWeek >= 0 && dayOfWeek <= 6 && typeof candidate.is_closed === 'boolean';
}

function normalizeCurrency(value: unknown): string {
  if (typeof value !== 'string') {
    return 'EUR';
  }

  const currency = value.trim().toUpperCase();
  return currency || 'EUR';
}

function toNonNegativeInt(value: unknown): number {
  const numeric = toNumber(value);
  return numeric === undefined ? 0 : Math.max(0, Math.floor(numeric));
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function timeOnDate(date: Date, time: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function formatTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!match) {
    return time;
  }

  const hours = Number(match[1]);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${period}`;
}
