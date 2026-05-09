import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  __resetFavoriteMutationStateForTests,
  favoriteRestaurant,
  unfavoriteRestaurant,
} from './favorites';

const API_BASE_URL = 'http://localhost:8020';

describe('favorite restaurant mutations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetFavoriteMutationStateForTests();
  });

  it('sends a POST request with CSRF when favoriting a restaurant', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { csrf_token: 'csrf-123' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              detail: 'Restaurant added to favorites.',
              is_favorite: true,
              favorite_count: 8,
              favorite_score: 8,
              last_favorited_at: '2026-05-09T10:00:00Z',
            },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    await expect(favoriteRestaurant('ada-bistro')).resolves.toMatchObject({
      is_favorite: true,
      favorite_count: 8,
      favorite_score: 8,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_BASE_URL}/api/v1/auth/csrf/`, {
      credentials: 'include',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/v1/restaurants/ada-bistro/favorite/`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );

    const requestOptions = fetchMock.mock.calls[1][1] as RequestInit;
    expect((requestOptions.headers as Headers).get('X-CSRFToken')).toBe('csrf-123');
    expect((requestOptions.headers as Headers).get('Accept')).toBe('application/json');
  });

  it('sends a DELETE request when unfavoriting a restaurant', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { csrf_token: 'csrf-456' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              detail: 'Restaurant removed from favorites.',
              is_favorite: false,
              favorite_count: 2,
              favorite_score: 2,
              last_favorited_at: null,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    await expect(unfavoriteRestaurant('nora-grill')).resolves.toMatchObject({
      is_favorite: false,
      favorite_count: 2,
      favorite_score: 2,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/v1/restaurants/nora-grill/favorite/`,
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    );
  });

  it('reuses the cached csrf token across repeated mutations', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { csrf_token: 'csrf-cached' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { detail: 'ok', is_favorite: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { detail: 'ok', is_favorite: false } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    await favoriteRestaurant('cache-test');
    await unfavoriteRestaurant('cache-test');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_BASE_URL}/api/v1/auth/csrf/`, {
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${API_BASE_URL}/api/v1/restaurants/cache-test/favorite/`,
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${API_BASE_URL}/api/v1/restaurants/cache-test/favorite/`,
      expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
    );
  });
});
