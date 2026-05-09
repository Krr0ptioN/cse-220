import type {
  FavoriteRestaurant,
  FavoriteRestaurantMutationResponse,
} from './api';

type FavoriteRestaurantLike = {
  slug: string;
  favorite_count?: number;
  favorite_score?: number;
  last_favorited_at?: string | null;
  is_favorite?: boolean;
};

export type FavoriteSnapshot = Pick<
  FavoriteRestaurantMutationResponse,
  'is_favorite' | 'favorite_count' | 'favorite_score' | 'last_favorited_at'
> & {
  restaurant?: FavoriteRestaurantLike | null;
};

export type FavoriteRestaurantCollection = Array<FavoriteRestaurant | FavoriteRestaurantLike>;

export type FavoriteRestaurantQueryData =
  | FavoriteRestaurantCollection
  | {
      data?: FavoriteRestaurantCollection;
      results?: FavoriteRestaurantCollection;
      count?: number;
      next?: string | null;
      previous?: string | null;
      pagination?: {
        page?: number;
        page_size?: number;
        total?: number;
        total_pages?: number;
        has_next?: boolean;
        has_previous?: boolean;
      };
    };

type FavoriteRestaurantQueryObject = {
  data?: FavoriteRestaurantCollection;
  results?: FavoriteRestaurantCollection;
  count?: number;
  next?: string | null;
  previous?: string | null;
  pagination?: {
    page?: number;
    page_size?: number;
    total?: number;
    total_pages?: number;
    has_next?: boolean;
    has_previous?: boolean;
  };
};

export function applyFavoriteSnapshot<T extends FavoriteRestaurantLike>(
  restaurant: T,
  snapshot: FavoriteSnapshot | null | undefined,
): T {
  if (!snapshot) {
    return restaurant;
  }

  const nextFavoriteCount =
    snapshot.favorite_count ?? snapshot.restaurant?.favorite_count;
  const nextFavoriteScore =
    snapshot.favorite_score ?? snapshot.restaurant?.favorite_score;
  const nextLastFavoritedAt =
    snapshot.last_favorited_at ?? snapshot.restaurant?.last_favorited_at;
  const nextIsFavorite =
    typeof snapshot.is_favorite === 'boolean'
      ? snapshot.is_favorite
      : snapshot.restaurant?.is_favorite;

  return {
    ...restaurant,
    favorite_count:
      typeof nextFavoriteCount === 'number'
        ? nextFavoriteCount
        : restaurant.favorite_count,
    favorite_score:
      typeof nextFavoriteScore === 'number'
        ? nextFavoriteScore
        : restaurant.favorite_score,
    last_favorited_at:
      typeof nextLastFavoritedAt === 'string' || nextLastFavoritedAt === null
        ? nextLastFavoritedAt
        : restaurant.last_favorited_at,
    is_favorite:
      typeof nextIsFavorite === 'boolean' ? nextIsFavorite : restaurant.is_favorite,
  } as T;
}

export function applyFavoriteSnapshotToRestaurants<T extends FavoriteRestaurantLike>(
  restaurants: T[],
  slug: string,
  snapshot: FavoriteSnapshot | null | undefined,
): T[] {
  return restaurants.map((restaurant) =>
    restaurant.slug === slug ? applyFavoriteSnapshot(restaurant, snapshot) : restaurant,
  );
}

export function removeRestaurantFromFavorites<T extends FavoriteRestaurantLike>(
  restaurants: T[],
  slug: string,
): T[] {
  return restaurants.filter((restaurant) => restaurant.slug !== slug);
}

export function applyFavoriteSnapshotToQueryData<T extends FavoriteRestaurantQueryData>(
  queryData: T,
  slug: string,
  snapshot: FavoriteSnapshot | null | undefined,
): T {
  if (Array.isArray(queryData)) {
    const nextRestaurants = applyFavoriteSnapshotToRestaurants(queryData, slug, snapshot);
    if (
      snapshot?.is_favorite &&
      !nextRestaurants.some((restaurant) => restaurant.slug === slug) &&
      snapshot.restaurant?.slug === slug
    ) {
      nextRestaurants.unshift(applyFavoriteSnapshot(snapshot.restaurant, snapshot));
    }
    return nextRestaurants as T;
  }

  if (!queryData || typeof queryData !== 'object') {
    return queryData;
  }

  const nextQueryData = { ...queryData } as FavoriteRestaurantQueryObject;

  if (Array.isArray(nextQueryData.data)) {
    const existed = nextQueryData.data.some((restaurant) => restaurant.slug === slug);
    nextQueryData.data = applyFavoriteSnapshotToRestaurants(
      nextQueryData.data,
      slug,
      snapshot,
    );

    if (!existed && snapshot?.is_favorite && snapshot.restaurant?.slug === slug) {
      nextQueryData.data = [
        applyFavoriteSnapshot(snapshot.restaurant, snapshot),
        ...nextQueryData.data,
      ];
    }

    if (!existed && snapshot?.is_favorite) {
      if (typeof nextQueryData.count === 'number') {
        nextQueryData.count += 1;
      }
      if (nextQueryData.pagination?.total !== undefined) {
        nextQueryData.pagination = {
          ...nextQueryData.pagination,
          total: nextQueryData.pagination.total + 1,
        };
      }
    }

    if (snapshot?.is_favorite === false && existed) {
      nextQueryData.data = removeRestaurantFromFavorites(nextQueryData.data, slug);
      if (typeof nextQueryData.count === 'number') {
        nextQueryData.count = Math.max(0, nextQueryData.count - 1);
      }
      if (nextQueryData.pagination?.total !== undefined) {
        nextQueryData.pagination = {
          ...nextQueryData.pagination,
          total: Math.max(0, nextQueryData.pagination.total - 1),
        };
      }
    }

    return nextQueryData as T;
  }

  if (Array.isArray(nextQueryData.results)) {
    const existed = nextQueryData.results.some((restaurant) => restaurant.slug === slug);
    nextQueryData.results = applyFavoriteSnapshotToRestaurants(
      nextQueryData.results,
      slug,
      snapshot,
    );

    if (!existed && snapshot?.is_favorite && snapshot.restaurant?.slug === slug) {
      nextQueryData.results = [
        applyFavoriteSnapshot(snapshot.restaurant, snapshot),
        ...nextQueryData.results,
      ];
    }

    if (!existed && snapshot?.is_favorite) {
      nextQueryData.count = Math.max(
        0,
        (nextQueryData.count ?? 0) + 1,
      );
      if (nextQueryData.pagination?.total !== undefined) {
        nextQueryData.pagination = {
          ...nextQueryData.pagination,
          total: nextQueryData.pagination.total + 1,
        };
      }
    }
  }

  return nextQueryData as T;
}

export function removeRestaurantFromQueryData<T extends FavoriteRestaurantQueryData>(
  queryData: T,
  slug: string,
): T {
  if (Array.isArray(queryData)) {
    const existed = queryData.some((restaurant) => restaurant.slug === slug);
    if (!existed) {
      return queryData;
    }

    return removeRestaurantFromFavorites(queryData, slug) as T;
  }

  if (!queryData || typeof queryData !== 'object') {
    return queryData;
  }

  const nextQueryData = { ...queryData } as FavoriteRestaurantQueryObject;

  if (Array.isArray(nextQueryData.data)) {
    const existed = nextQueryData.data.some((restaurant) => restaurant.slug === slug);
    if (!existed) {
      return queryData;
    }

    nextQueryData.data = removeRestaurantFromFavorites(nextQueryData.data, slug);
    if (typeof nextQueryData.count === 'number') {
      nextQueryData.count = Math.max(0, nextQueryData.count - 1);
    }
    if (nextQueryData.pagination?.total !== undefined) {
      nextQueryData.pagination = {
        ...nextQueryData.pagination,
        total: Math.max(0, nextQueryData.pagination.total - 1),
      };
    }
    return nextQueryData as T;
  }

  if (Array.isArray(nextQueryData.results)) {
    const existed = nextQueryData.results.some((restaurant) => restaurant.slug === slug);
    if (!existed) {
      return queryData;
    }

    nextQueryData.results = removeRestaurantFromFavorites(nextQueryData.results, slug);
    if (typeof nextQueryData.count === 'number') {
      nextQueryData.count = Math.max(0, nextQueryData.count - 1);
    }
    if (nextQueryData.pagination?.total !== undefined) {
      nextQueryData.pagination = {
        ...nextQueryData.pagination,
        total: Math.max(0, nextQueryData.pagination.total - 1),
      };
    }
  }

  return nextQueryData as T;
}
