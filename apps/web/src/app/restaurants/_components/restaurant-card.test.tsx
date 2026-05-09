// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useFavoriteRestaurantMutationMock: vi.fn(),
}));

vi.mock('ui-common', () => ({
  AspectRatio: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ asChild, children, ...props }: any) =>
    asChild ? (
      React.cloneElement(React.Children.only(children), props)
    ) : (
      <button {...props}>{children}</button>
    ),
}));

vi.mock('@/lib/restaurants', () => ({
  getRestaurantImageUrl: () => 'https://example.com/restaurant.jpg',
  getRestaurantDistanceKm: () => 1.2,
  getRestaurantIsOpen: () => true,
}));

vi.mock('../_hooks/use-favorite-restaurant-mutation', () => ({
  useFavoriteRestaurantMutation: mocks.useFavoriteRestaurantMutationMock,
}));

import { RestaurantCard } from './restaurant-card';

describe('RestaurantCard', () => {
  beforeEach(() => {
    mocks.useFavoriteRestaurantMutationMock.mockReturnValue({
      isLoading: false,
      canFavorite: true,
      isSaving: false,
      isLocked: false,
      isFavorite: false,
      favoriteCount: 10,
      favoriteScore: 10,
      lastFavoritedAt: null,
      toggleFavorite: vi.fn(),
      setFavorite: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the favorite control and delegates clicks to the shared hook', () => {
    const toggleFavorite = vi.fn();
    mocks.useFavoriteRestaurantMutationMock.mockReturnValue({
      isLoading: false,
      canFavorite: true,
      isSaving: false,
      isLocked: false,
      isFavorite: false,
      favoriteCount: 10,
      favoriteScore: 10,
      lastFavoritedAt: null,
      toggleFavorite,
      setFavorite: vi.fn(),
    });

    render(
      <RestaurantCard
        restaurant={{
          id: 'restaurant-1',
          slug: 'ada-bistro',
          name: 'Ada Bistro',
          description: 'Seasonal plates',
          city: 'Istanbul',
          favorite_count: 10,
          is_favorite: false,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /favorite restaurant/i }));

    expect(toggleFavorite).toHaveBeenCalledTimes(1);
    expect(mocks.useFavoriteRestaurantMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'ada-bistro' }),
    );
  });

  it('prompts anonymous visitors to sign in instead of calling favorite', () => {
    mocks.useFavoriteRestaurantMutationMock.mockReturnValue({
      isLoading: false,
      canFavorite: false,
      isSaving: false,
      isLocked: false,
      isFavorite: false,
      favoriteCount: 0,
      favoriteScore: 0,
      lastFavoritedAt: null,
      toggleFavorite: vi.fn(),
      setFavorite: vi.fn(),
    });

    render(
      <RestaurantCard
        restaurant={{
          id: 'restaurant-4',
          slug: 'anonymous-access',
          name: 'Anonymous Access',
          description: 'No session',
          city: 'Istanbul',
          favorite_count: 0,
          is_favorite: false,
        }}
      />,
    );

    expect(
      screen.getByRole('link', { name: /sign in to favorite/i }),
    ).toBeTruthy();
  });
});
