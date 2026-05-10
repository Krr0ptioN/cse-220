'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  buildRestaurantsUrl,
  normalizeRestaurantsResponse,
} from '@/lib/restaurants';
import {
  useExploreStore,
  useExploreRestaurants,
  useExploreFilters,
  useExploreLoading,
  useExploreError,
  useExplorePagination,
} from '../_stores/explore-store';

const DEFAULT_PAGE_SIZE = 12;

function toPositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function toNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useRestaurantData(initialQuery: string, initialPage: number) {
  const searchParams = useSearchParams();

  const query = (searchParams.get('q') ?? initialQuery).trim();
  const location = (searchParams.get('location') ?? '').trim();
  const page = toPositiveInt(searchParams.get('page')) ?? initialPage;
  const latitude =
    toNumber(searchParams.get('lat')) ?? toNumber(searchParams.get('latitude'));
  const longitude =
    toNumber(searchParams.get('lng')) ?? toNumber(searchParams.get('longitude'));
  const sort = (searchParams.get('sort') ?? '').trim() || null;
  const price =
    (searchParams.get('price') ?? searchParams.get('price_range') ?? '').trim() ||
    null;
  const minRating =
    toNumber(searchParams.get('min_rating')) ?? toNumber(searchParams.get('minRating'));

  const restaurants = useExploreRestaurants();
  const filters = useExploreFilters();
  const isLoading = useExploreLoading();
  const errorMessage = useExploreError();
  const pagination = useExplorePagination();

  useEffect(() => {
    useExploreStore.getState().setInputValue(query);
  }, [query]);

  useEffect(() => {
    useExploreStore.getState().setPriceFilter(price);
    useExploreStore.getState().setRatingFilter(minRating);
  }, [price, minRating]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRestaurants() {
      useExploreStore.getState().setLoading(true);
      useExploreStore.getState().setError(null);

      try {
        const response = await fetch(
          buildRestaurantsUrl(page, DEFAULT_PAGE_SIZE, {
            query,
            location,
            latitude,
            longitude,
            sort,
            price,
            minRating,
          }),
          {
            cache: 'no-store',
            credentials: 'include',
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        const normalized = normalizeRestaurantsResponse(payload);
        const previousRestaurants = useExploreStore.getState().restaurants;
        const mergedFavorites = normalized.data.map((restaurant) => {
          const existing = previousRestaurants.find(
            (item) => item.slug === restaurant.slug,
          );

          if (!existing) {
            return restaurant;
          }

          return {
            ...restaurant,
            is_favorite:
              typeof existing.is_favorite === 'boolean'
                ? existing.is_favorite
                : restaurant.is_favorite,
            favorite_count:
              typeof existing.favorite_count === 'number'
                ? existing.favorite_count
                : restaurant.favorite_count,
            favorite_score:
              typeof existing.favorite_score === 'number'
                ? existing.favorite_score
                : restaurant.favorite_score,
            last_favorited_at:
              typeof existing.last_favorited_at === 'string' ||
              existing.last_favorited_at === null
                ? existing.last_favorited_at
                : restaurant.last_favorited_at,
          };
        });

        useExploreStore.getState().setRestaurants(mergedFavorites);
        useExploreStore.getState().setPagination(normalized.pagination);
      } catch (error) {
        if (controller.signal.aborted) return;

        useExploreStore.getState().setRestaurants([]);
        useExploreStore
          .getState()
          .setError(
            error instanceof Error
              ? `Could not load restaurants right now (${error.message}).`
              : 'Could not load restaurants right now.',
          );
      } finally {
        if (!controller.signal.aborted) {
          useExploreStore.getState().setLoading(false);
        }
      }
    }

    void loadRestaurants();
    return () => controller.abort();
  }, [page, query, location, latitude, longitude, sort, price, minRating]);

  const activeFilterCount = useMemo(
    () => [filters.price, filters.rating].filter(Boolean).length,
    [filters.price, filters.rating],
  );

  const isEmpty = useMemo(
    () => !isLoading && !errorMessage && restaurants.length === 0,
    [isLoading, errorMessage, restaurants.length],
  );

  const displayLoading = useMemo(
    () => isLoading && !errorMessage,
    [isLoading, errorMessage],
  );

  return {
    query,
    location,
    latitude,
    longitude,
    sort,
    page,
    restaurants,
    pagination,
    isLoading,
    errorMessage,
    filters,
    activeFilterCount,
    isEmpty,
    displayLoading,
  };
}
