'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import {
  favoriteRestaurant,
  unfavoriteRestaurant,
  type FavoriteRestaurantMutationResponse,
} from '@flavor-map/ui-module-restaurants';

import {
  applyFavoriteSnapshot,
  applyFavoriteSnapshotToQueryData,
  type FavoriteSnapshot,
  removeRestaurantFromQueryData,
  useDebouncedExclusiveAction,
} from '@flavor-map/ui-module-restaurants';
import { type Restaurant } from '@/lib/restaurants';
import { useFavoriteSession } from '../_components/use-favorite-session';
import { useExploreStore } from '../_stores/explore-store';

type FavoriteRestaurantLike = Pick<
  Restaurant,
  'slug' | 'is_favorite' | 'favorite_count' | 'favorite_score' | 'last_favorited_at'
>;

type FavoriteState = {
  isFavorite: boolean;
  favoriteCount: number;
  favoriteScore: number;
  lastFavoritedAt: string | null;
};

type FavoriteMutationContext = {
  previousState: FavoriteState;
  previousRestaurants: Restaurant[];
  previousQueries: Array<[QueryKey, unknown]>;
};

function createFavoriteState(restaurant: FavoriteRestaurantLike): FavoriteState {
  return {
    isFavorite: Boolean(restaurant.is_favorite),
    favoriteCount: restaurant.favorite_count ?? 0,
    favoriteScore: restaurant.favorite_score ?? 0,
    lastFavoritedAt: restaurant.last_favorited_at ?? null,
  };
}

function buildSnapshotFromState(
  state: FavoriteState,
  restaurant: Restaurant,
): FavoriteSnapshot {
  return {
    is_favorite: state.isFavorite,
    favorite_count: state.favoriteCount,
    favorite_score: state.favoriteScore,
    last_favorited_at: state.lastFavoritedAt,
    restaurant: applyFavoriteSnapshot(restaurant, {
      is_favorite: state.isFavorite,
      favorite_count: state.favoriteCount,
      favorite_score: state.favoriteScore,
      last_favorited_at: state.lastFavoritedAt,
    }),
  };
}

function buildSnapshotFromMutationResult(
  result: FavoriteRestaurantMutationResponse,
  fallbackRestaurant: Restaurant,
): FavoriteSnapshot {
  const restaurant = result.restaurant
    ? applyFavoriteSnapshot(result.restaurant, result)
    : applyFavoriteSnapshot(fallbackRestaurant, result);

  return {
    is_favorite: result.is_favorite,
    favorite_count: result.favorite_count ?? restaurant.favorite_count,
    favorite_score: result.favorite_score ?? restaurant.favorite_score,
    last_favorited_at: result.last_favorited_at ?? restaurant.last_favorited_at,
    restaurant,
  };
}

function syncFavoriteState(current: FavoriteState, restaurant: FavoriteRestaurantLike) {
  return {
    ...current,
    isFavorite: Boolean(restaurant.is_favorite),
    favoriteCount: restaurant.favorite_count ?? current.favoriteCount,
    favoriteScore: restaurant.favorite_score ?? current.favoriteScore,
    lastFavoritedAt: restaurant.last_favorited_at ?? null,
  };
}

export function useFavoriteRestaurantMutation(restaurant: FavoriteRestaurantLike) {
  const queryClient = useQueryClient();
  const { isLoading: isSessionLoading, canFavorite } = useFavoriteSession();
  const { isLocked, runExclusive } = useDebouncedExclusiveAction(350);
  const [state, setState] = useState<FavoriteState>(() => createFavoriteState(restaurant));
  const mountedRef = useRef(true);

  const restaurantSlug = restaurant.slug;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setState((current) => syncFavoriteState(current, restaurant));
  }, [
    restaurantSlug,
    restaurant.is_favorite,
    restaurant.favorite_count,
    restaurant.favorite_score,
    restaurant.last_favorited_at,
  ]);

  const commitState = useCallback((nextState: FavoriteState) => {
    if (mountedRef.current) {
      setState(nextState);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (nextFavorite: boolean) => {
      return nextFavorite
        ? favoriteRestaurant(restaurantSlug)
        : unfavoriteRestaurant(restaurantSlug);
    },
    onMutate: async (nextFavorite) => {
      await queryClient.cancelQueries({ queryKey: ['favorite-restaurants'] });

      const previousQueries = queryClient.getQueriesData({
        queryKey: ['favorite-restaurants'],
      });
      const previousRestaurants = useExploreStore.getState().restaurants;
      const previousState = state;

      const optimisticState: FavoriteState = {
        isFavorite: nextFavorite,
        favoriteCount: Math.max(0, previousState.favoriteCount + (nextFavorite ? 1 : -1)),
        favoriteScore: Math.max(0, previousState.favoriteScore + (nextFavorite ? 1 : -1)),
        lastFavoritedAt: nextFavorite ? new Date().toISOString() : previousState.lastFavoritedAt,
      };
      const optimisticSnapshot = buildSnapshotFromState(optimisticState, restaurant as Restaurant);

      commitState(optimisticState);
      useExploreStore.getState().setRestaurants(
        previousRestaurants.map((item) =>
          item.slug === restaurantSlug
            ? (applyFavoriteSnapshot(item, optimisticSnapshot) as Restaurant)
            : item,
        ),
      );

      queryClient.setQueriesData(
        { queryKey: ['favorite-restaurants'] },
        (current) =>
          typeof current === 'undefined'
            ? current
            : nextFavorite
              ? applyFavoriteSnapshotToQueryData(
                  current as Parameters<typeof applyFavoriteSnapshotToQueryData>[0],
                  restaurantSlug,
                  optimisticSnapshot,
                )
              : removeRestaurantFromQueryData(
                  current as Parameters<typeof removeRestaurantFromQueryData>[0],
                  restaurantSlug,
                ),
      );

      return {
        previousState,
        previousRestaurants,
        previousQueries,
      } satisfies FavoriteMutationContext;
    },
    onError: (_error, _nextFavorite, context) => {
      if (!context) {
        return;
      }

      commitState(context.previousState);
      useExploreStore.getState().setRestaurants(context.previousRestaurants);
      context.previousQueries.forEach(([queryKey, queryData]) => {
        queryClient.setQueryData(queryKey, queryData);
      });
    },
    onSuccess: (result) => {
      const canonicalSnapshot = buildSnapshotFromMutationResult(
        result,
        restaurant as Restaurant,
      );
      const canonicalRestaurant = canonicalSnapshot.restaurant
        ? (canonicalSnapshot.restaurant as Restaurant)
        : (applyFavoriteSnapshot(restaurant as Restaurant, canonicalSnapshot) as Restaurant);

      commitState(createFavoriteState(canonicalRestaurant));
      const currentRestaurants = useExploreStore.getState().restaurants;
      useExploreStore.getState().setRestaurants(
        currentRestaurants.map((item) =>
          item.slug === restaurantSlug
            ? (applyFavoriteSnapshot(item, canonicalSnapshot) as Restaurant)
            : item,
        ),
      );

      queryClient.setQueriesData(
        { queryKey: ['favorite-restaurants'] },
        (current) =>
          typeof current === 'undefined'
            ? current
            : result.is_favorite
              ? applyFavoriteSnapshotToQueryData(
                  current as Parameters<typeof applyFavoriteSnapshotToQueryData>[0],
                  restaurantSlug,
                  canonicalSnapshot,
                )
              : removeRestaurantFromQueryData(
                  current as Parameters<typeof removeRestaurantFromQueryData>[0],
                  restaurantSlug,
                ),
      );

      void queryClient.invalidateQueries({
        queryKey: ['favorite-restaurants'],
      });
    },
  });

  const setFavorite = useCallback(
    async (nextFavorite: boolean) => {
      if (!canFavorite || nextFavorite === state.isFavorite) {
        return;
      }

      await runExclusive(async () => {
        await mutation.mutateAsync(nextFavorite);
      });
    },
    [canFavorite, mutation, runExclusive, state.isFavorite],
  );

  const toggleFavorite = useCallback(async () => {
    await setFavorite(!state.isFavorite);
  }, [setFavorite, state.isFavorite]);

  return useMemo(
    () => ({
      isLoading: isSessionLoading,
      canFavorite,
      isSaving: mutation.isPending || isLocked,
      isLocked,
      isFavorite: state.isFavorite,
      favoriteCount: state.favoriteCount,
      favoriteScore: state.favoriteScore,
      lastFavoritedAt: state.lastFavoritedAt,
      setFavorite,
      toggleFavorite,
    }),
    [
      canFavorite,
      isLocked,
      isSessionLoading,
      mutation.isPending,
      setFavorite,
      state.favoriteCount,
      state.favoriteScore,
      state.isFavorite,
      state.lastFavoritedAt,
      toggleFavorite,
    ],
  );
}
