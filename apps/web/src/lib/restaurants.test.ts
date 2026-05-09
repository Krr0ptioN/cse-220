import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchRestaurantDetail,
  getRestaurantStatus,
  normalizeRestaurantsResponse,
  type RestaurantOpeningHour,
} from './restaurants';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('normalizeRestaurantsResponse', () => {
  it('preserves categories, opening hours, and favorite metrics', () => {
    const response = normalizeRestaurantsResponse({
      data: [
        {
          id: 'restaurant-1',
          name: 'Agora Kitchen',
          slug: 'agora-kitchen',
          categories: [
            { id: 'cat-1', name: 'Mediterranean', slug: 'mediterranean' },
          ],
          opening_hours: [
            { arbitrary: 'object' },
            {
              day_of_week: 9,
              open_time: '08:00',
              close_time: '17:00',
              is_closed: false,
            },
            {
              id: 'hours-2',
              day_of_week: 2,
              display_day: 'Wednesday',
              open_time: '10:00',
              close_time: '22:00',
              is_closed: false,
            },
            {
              id: 'hours-0',
              day_of_week: 0,
              display_day: 'Monday',
              open_time: '09:00',
              close_time: '21:00',
              is_closed: false,
            },
          ],
          favorite_count: '7',
          favorite_score: 13.8,
          last_favorited_at: '2026-05-01T12:30:00Z',
          is_favorite: true,
        },
      ],
      pagination: {
        page: 1,
        page_size: 12,
        total: 1,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      },
    });

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({
      categories: [
        { id: 'cat-1', name: 'Mediterranean', slug: 'mediterranean' },
      ],
      favorite_count: 7,
      favorite_score: 13,
      last_favorited_at: '2026-05-01T12:30:00Z',
      is_favorite: true,
    });
    expect(response.data[0].opening_hours).toEqual([
      {
        id: 'hours-0',
        day_of_week: 0,
        display_day: 'Monday',
        open_time: '09:00',
        close_time: '21:00',
        is_closed: false,
      },
      {
        id: 'hours-2',
        day_of_week: 2,
        display_day: 'Wednesday',
        open_time: '10:00',
        close_time: '22:00',
        is_closed: false,
      },
    ]);
  });
});

describe('getRestaurantStatus', () => {
  it('returns closing-soon when the restaurant closes in 30 minutes', () => {
    const openingHours: RestaurantOpeningHour[] = [
      {
        id: 'hours-0',
        day_of_week: 0,
        display_day: 'Monday',
        open_time: '09:00',
        close_time: '14:30',
        is_closed: false,
      },
    ];

    const status = getRestaurantStatus(
      openingHours,
      new Date('2026-05-04T14:00:00'),
    );

    expect(status).toEqual({
      state: 'closing-soon',
      label: 'Open',
      detail: 'Closes at 2:30 PM',
      minutesUntilClose: 30,
    });
  });

  it('returns closed for an explicitly closed day', () => {
    const openingHours: RestaurantOpeningHour[] = [
      {
        id: 'hours-0',
        day_of_week: 0,
        display_day: 'Monday',
        is_closed: true,
      },
    ];

    expect(
      getRestaurantStatus(openingHours, new Date('2026-05-04T12:00:00')),
    ).toEqual({
      state: 'closed',
      label: 'Closed',
      detail: 'Closed today',
    });
  });

  it('returns open when inside normal operating hours', () => {
    const openingHours: RestaurantOpeningHour[] = [
      {
        id: 'hours-0',
        day_of_week: 0,
        display_day: 'Monday',
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
    ];

    expect(
      getRestaurantStatus(openingHours, new Date('2026-05-04T12:00:00')),
    ).toEqual({
      state: 'open',
      label: 'Open',
      detail: 'Open until 5:00 PM',
      minutesUntilClose: 300,
    });
  });

  it('returns closed before opening time', () => {
    const openingHours: RestaurantOpeningHour[] = [
      {
        id: 'hours-0',
        day_of_week: 0,
        display_day: 'Monday',
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
    ];

    expect(
      getRestaurantStatus(openingHours, new Date('2026-05-04T08:30:00')),
    ).toEqual({
      state: 'closed',
      label: 'Closed',
      detail: 'Opens at 9:00 AM',
    });
  });
});

describe('fetchRestaurantDetail', () => {
  it('forwards the request cookie header so favorite state can be personalized', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: 'restaurant-1',
            slug: 'ada-bistro',
            name: 'Ada Bistro',
            is_favorite: true,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await fetchRestaurantDetail('ada-bistro', 'sessionid=abc; csrftoken=xyz');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/restaurants/ada-bistro/'),
      expect.objectContaining({
        cache: 'no-store',
        credentials: 'include',
        headers: {
          cookie: 'sessionid=abc; csrftoken=xyz',
        },
      }),
    );
  });
});
