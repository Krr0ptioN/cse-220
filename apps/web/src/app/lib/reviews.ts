import { getApiBaseUrl } from './restaurants';

export type Review = {
  id: string;
  user: {
    id: string;
    display_name: string;
    username: string;
  };
  rating: number;
  content: string;
  like_count: number;
  dislike_count: number;
  created_at: string;
  replies?: Review[];
};

export type ReviewResponse = {
  data: Review[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

export async function fetchRestaurantReviews(
  slug: string,
  page = 1,
  pageSize = 10,
): Promise<ReviewResponse> {
  const fallback: ReviewResponse = {
    data: [],
    pagination: {
      page,
      page_size: pageSize,
      total: 0,
      total_pages: 1,
      has_next: false,
      has_previous: false,
    },
  };

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/restaurants/${slug}/reviews/?page=${page}&page_size=${pageSize}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return fallback;
    }

    const payload = (await response.json()) as {
      data?: Partial<Review>[];
      pagination?: Partial<ReviewResponse['pagination']>;
    };

    if (!payload?.data) {
      return fallback;
    }

    const reviews = payload.data
      .filter((r): r is Review => !!(r.id && r.user && r.rating))
      .map((r) => ({
        id: r.id,
        user: r.user,
        rating: r.rating,
        content: r.content || '',
        like_count: r.like_count ?? 0,
        dislike_count: r.dislike_count ?? 0,
        created_at: r.created_at || new Date().toISOString(),
        replies: r.replies || [],
      }));

    return {
      data: reviews,
      pagination: {
        page: payload.pagination?.page ?? page,
        page_size: payload.pagination?.page_size ?? pageSize,
        total: payload.pagination?.total ?? reviews.length,
        total_pages: payload.pagination?.total_pages ?? 1,
        has_next: payload.pagination?.has_next ?? false,
        has_previous: payload.pagination?.has_previous ?? false,
      },
    };
  } catch {
    return fallback;
  }
}

export async function submitReview(
  restaurantSlug: string,
  rating: number,
  content: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/restaurants/${restaurantSlug}/reviews/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, content }),
        credentials: 'include',
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        success: false,
        error: error?.message || 'Failed to submit review.',
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}
