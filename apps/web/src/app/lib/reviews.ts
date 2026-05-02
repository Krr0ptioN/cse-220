import { getApiBaseUrl } from './restaurants';

export type Review = {
  id: string;
  parent_id?: string | null;
  user: {
    id: string;
    display_name: string;
    username: string;
  };
  rating: number;
  content: string;
  like_count: number;
  dislike_count: number;
  is_business_answer?: boolean;
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

    return normalizeReviewThreads(await response.json(), page, pageSize);
  } catch {
    return fallback;
  }
}

export function normalizeReviewThreads(
  payload: unknown,
  page = 1,
  pageSize = 10,
): ReviewResponse {
  const candidate = isRecord(payload) ? payload : {};
  const data = Array.isArray(candidate.data)
    ? candidate.data
        .map((item) => normalizeReview(item, false))
        .filter((item): item is Review => item !== null)
    : [];
  const pagination = isRecord(candidate.pagination) ? candidate.pagination : {};

  return {
    data,
    pagination: {
      page: positiveNumber(pagination.page) ?? page,
      page_size: positiveNumber(pagination.page_size) ?? pageSize,
      total: nonNegativeNumber(pagination.total) ?? data.length,
      total_pages: positiveNumber(pagination.total_pages) ?? 1,
      has_next: Boolean(pagination.has_next),
      has_previous: Boolean(pagination.has_previous),
    },
  };
}

function normalizeReview(candidate: unknown, isReply: boolean): Review | null {
  if (!isRecord(candidate)) return null;

  const id = stringValue(candidate.id);
  const user = normalizeUser(candidate.user);
  if (!id || !user) return null;

  const rating = isReply
    ? (nonNegativeNumber(candidate.rating) ?? 0)
    : positiveNumber(candidate.rating);
  if (rating === undefined) return null;

  const review: Review = {
    id,
    parent_id: stringValue(candidate.parent_id) ?? null,
    user,
    rating,
    content: stringValue(candidate.content) ?? '',
    like_count: nonNegativeNumber(candidate.like_count) ?? 0,
    dislike_count: nonNegativeNumber(candidate.dislike_count) ?? 0,
    is_business_answer: Boolean(candidate.is_business_answer),
    created_at: stringValue(candidate.created_at) ?? new Date().toISOString(),
  };

  if (!isReply) {
    review.replies = Array.isArray(candidate.replies)
      ? candidate.replies
          .map((reply) => normalizeReview(reply, true))
          .filter((reply): reply is Review => reply !== null)
      : [];
  }

  return review;
}

function normalizeUser(candidate: unknown): Review['user'] | null {
  if (!isRecord(candidate)) return null;
  const id = stringValue(candidate.id);
  const username = stringValue(candidate.username) ?? id;
  if (!id || !username) return null;

  return {
    id,
    username,
    display_name: stringValue(candidate.display_name) ?? username,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 1 ? number : undefined;
}

function nonNegativeNumber(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
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
