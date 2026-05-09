
export interface RestaurantCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  icon_url?: string;
  sort_order?: number;
}

export interface RestaurantOpeningHour {
  id?: string;
  day_of_week: number;
  day_display?: string;
  display_day?: string;
  open_time?: string | null;
  close_time?: string | null;
  is_closed: boolean;
}

export interface RestaurantStatus {
  state: "open" | "closing-soon" | "closed" | "unknown";
  label: string;
  detail: string;
  minutesUntilClose?: number;
}

export interface FavoriteRestaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone?: string;
  website?: string;
  categories?: RestaurantCategory[];
  opening_hours?: RestaurantOpeningHour[];
  favorite_count?: number;
  favorite_score?: number;
  last_favorited_at?: string | null;
  is_favorite?: boolean;
  primary_photo_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  price_range?: "1" | "2" | "3" | string;
  average_rating?: string | number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FavoriteRestaurantsFilters {
  page?: number;
  page_size?: number;
  include?: string;
  omit?: string;
  with?: string;
  min_rating?: number;
  price?: string;
  price_range?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export interface ApiEnvelope<T> {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface FavoriteRestaurantMutationResponse {
  detail: string;
  is_favorite: boolean;
  favorite_count?: number;
  favorite_score?: number;
  last_favorited_at?: string | null;
  restaurant?: FavoriteRestaurant;
}
