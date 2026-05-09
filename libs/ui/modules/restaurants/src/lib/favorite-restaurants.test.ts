import { describe, expect, it } from 'vitest';

import {
  applyFavoriteSnapshot,
  applyFavoriteSnapshotToQueryData,
  removeRestaurantFromQueryData,
} from './favorite-restaurants';

describe('favorite restaurant helpers', () => {
  it('applies canonical favorite state to a restaurant record', () => {
    const next = applyFavoriteSnapshot(
      {
        slug: 'ada-bistro',
        favorite_count: 3,
        favorite_score: 4,
        is_favorite: false,
      },
      {
        is_favorite: true,
        favorite_count: 8,
        favorite_score: 9,
        last_favorited_at: '2026-05-09T10:00:00Z',
      },
    );

    expect(next).toMatchObject({
      slug: 'ada-bistro',
      is_favorite: true,
      favorite_count: 8,
      favorite_score: 9,
      last_favorited_at: '2026-05-09T10:00:00Z',
    });
  });

  it('removes an unfavorited restaurant from query data arrays', () => {
    expect(
      removeRestaurantFromQueryData(
        [
          { slug: 'ada-bistro', favorite_count: 8 },
          { slug: 'nora-grill', favorite_count: 4 },
        ],
        'ada-bistro',
      ),
    ).toEqual([{ slug: 'nora-grill', favorite_count: 4 }]);
  });

  it('updates paginated favorite query data with the optimistic snapshot', () => {
    const next = applyFavoriteSnapshotToQueryData(
      {
        data: [
          { slug: 'nora-grill', favorite_count: 4, is_favorite: false },
        ],
        count: 1,
        pagination: { total: 1 },
      },
      'ada-bistro',
      {
        is_favorite: true,
        favorite_count: 9,
        favorite_score: 11,
        restaurant: {
          slug: 'ada-bistro',
          favorite_count: 9,
          favorite_score: 11,
          is_favorite: true,
        },
      },
    );

    expect(next.data).toHaveLength(2);
    expect(next.data?.[0]).toMatchObject({
      slug: 'ada-bistro',
      is_favorite: true,
      favorite_count: 9,
    });
    expect(next.count).toBe(2);
    expect(next.pagination?.total).toBe(2);
  });
});
