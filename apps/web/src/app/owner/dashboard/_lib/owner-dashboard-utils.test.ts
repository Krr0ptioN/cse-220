import { describe, expect, it } from 'vitest';

import type { Restaurant } from '@/lib/restaurants';
import {
  buildRestaurantWriteFormData,
  emptyOpeningHoursFormValues,
  emptyRestaurantFormValues,
  restaurantToFormValues,
} from './owner-dashboard-utils';

describe('owner dashboard utilities', () => {
  it('creates a multipart payload from form values', () => {
    const formData = buildRestaurantWriteFormData({
      name: '  Ada Bistro  ',
      categoryId: 'cat-1',
      description: '  Seasonal plates  ',
      addressLine1: '  Main Street 1  ',
      city: '  Istanbul  ',
      district: '  Kadikoy  ',
      phone: '  +90 555 0101  ',
      website: '  https://ada.example.com  ',
      priceRange: '2',
      primaryPhotoFile: null,
      primaryPhotoUrl: '',
      openingHours: emptyOpeningHoursFormValues(),
    });

    expect(formData.get('name')).toBe('Ada Bistro');
    expect(formData.get('category_ids')).toBe('cat-1');
    expect(formData.get('description')).toBe('Seasonal plates');
    expect(formData.get('address_line1')).toBe('Main Street 1');
    expect(formData.get('city')).toBe('Istanbul');
    expect(formData.get('district')).toBe('Kadikoy');
    expect(formData.get('phone')).toBe('+90 555 0101');
    expect(formData.get('website')).toBe('https://ada.example.com');
    expect(formData.get('price_range')).toBe('2');
  });

  it('preserves optional blank fields as empty strings for updates', () => {
    const formData = buildRestaurantWriteFormData({
      ...emptyRestaurantFormValues(),
      name: 'Ada Bistro',
      categoryId: 'cat-1',
      description: 'Seasonal plates',
      addressLine1: 'Main Street 1',
      city: 'Istanbul',
    });

    expect(formData.get('district')).toBe('');
    expect(formData.get('phone')).toBe('');
    expect(formData.get('website')).toBe('');
    expect(formData.get('price_range')).toBe('2');
  });

  it('converts an existing restaurant to editable form values', () => {
    const restaurant: Restaurant = {
      id: 'restaurant-1',
      slug: 'ada-bistro',
      name: 'Ada Bistro',
      category: { id: 'cat-1', name: 'Modern' },
      description: 'Seasonal plates',
      address_line1: 'Main Street 1',
      city: 'Istanbul',
      district: 'Kadikoy',
      phone: '+90 555 0101',
      website: 'https://ada.example.com',
      price_range: '3',
      primary_photo_url: 'https://media.example.com/primary-photo.jpg',
      opening_hours: [
        {
          id: 'hour-1',
          day_of_week: 0,
          day_display: 'Monday',
          open_time: '09:00:00',
          close_time: '22:00:00',
          is_closed: false,
        },
      ],
    };

    expect(restaurantToFormValues(restaurant)).toMatchObject({
      name: 'Ada Bistro',
      categoryId: 'cat-1',
      description: 'Seasonal plates',
      addressLine1: 'Main Street 1',
      city: 'Istanbul',
      district: 'Kadikoy',
      phone: '+90 555 0101',
      website: 'https://ada.example.com',
      priceRange: '3',
      primaryPhotoFile: null,
      primaryPhotoUrl: 'https://media.example.com/primary-photo.jpg',
      openingHours: expect.arrayContaining([
        expect.objectContaining({
          dayOfWeek: 0,
          dayDisplay: 'Monday',
          openTime: '09:00',
          closeTime: '22:00',
          isClosed: false,
        }),
      ]),
    });
  });

  it('serializes weekly opening hours into FormData keys accepted by DRF', () => {
    const values = restaurantToFormValues({
      id: '1',
      slug: 'ada-bistro',
      name: 'Ada Bistro',
      description: 'Seasonal plates',
      address_line1: 'Main Street 1',
      city: 'Istanbul',
      district: 'Kadikoy',
      price_range: '2',
      opening_hours: [
        {
          id: 'h1',
          day_of_week: 0,
          day_display: 'Monday',
          open_time: '09:00:00',
          close_time: '22:00:00',
          is_closed: false,
        },
      ],
    });

    const formData = buildRestaurantWriteFormData(values);

    expect(formData.get('opening_hours[0][day_of_week]')).toBe('0');
    expect(formData.get('opening_hours[0][open_time]')).toBe('09:00');
    expect(formData.get('opening_hours[0][close_time]')).toBe('22:00');
    expect(formData.get('opening_hours[0][is_closed]')).toBe('false');
  });

  it('creates seven default opening hour rows', () => {
    expect(emptyOpeningHoursFormValues()).toHaveLength(7);
  });
});
