import { resolveApiAssetUrl, type Restaurant } from '@/lib/restaurants';

export type OpeningHourFormValues = {
  dayOfWeek: number;
  dayDisplay: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export type RestaurantFormValues = {
  name: string;
  categoryId: string;
  description: string;
  addressLine1: string;
  city: string;
  district: string;
  phone: string;
  website: string;
  priceRange: string;
  primaryPhotoFile: File | null;
  primaryPhotoUrl: string;
  galleryPhotoFiles: File[];
  openingHours: OpeningHourFormValues[];
};

export function emptyRestaurantFormValues(): RestaurantFormValues {
  return {
    name: '',
    categoryId: '',
    description: '',
    addressLine1: '',
    city: '',
    district: '',
    phone: '',
    website: '',
    priceRange: '2',
    primaryPhotoFile: null,
    primaryPhotoUrl: '',
    galleryPhotoFiles: [],
    openingHours: emptyOpeningHoursFormValues(),
  };
}

export function emptyOpeningHoursFormValues(): OpeningHourFormValues[] {
  return [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ].map((dayDisplay, dayOfWeek) => ({
    dayOfWeek,
    dayDisplay,
    openTime: '09:00',
    closeTime: '22:00',
    isClosed: false,
  }));
}

export function restaurantToFormValues(
  restaurant: Restaurant,
): RestaurantFormValues {
  const category = restaurant.category ?? restaurant.categories?.[0];
  const defaultOpeningHours = emptyOpeningHoursFormValues();
  const openingHoursByDay = new Map(
    (restaurant.opening_hours ?? []).map((hour) => [hour.day_of_week, hour]),
  );

  return {
    name: restaurant.name,
    categoryId: category?.id ?? '',
    description: restaurant.description ?? '',
    addressLine1: restaurant.address_line1 ?? '',
    city: restaurant.city ?? '',
    district: restaurant.district ?? '',
    phone: restaurant.phone ?? '',
    website: restaurant.website ?? '',
    priceRange: restaurant.price_range ?? '2',
    primaryPhotoFile: null,
    primaryPhotoUrl: resolveApiAssetUrl(restaurant.primary_photo_url),
    galleryPhotoFiles: [],
    openingHours: defaultOpeningHours.map((fallback) => {
      const hour = openingHoursByDay.get(fallback.dayOfWeek);

      if (!hour) {
        return fallback;
      }

      return {
        dayOfWeek: hour.day_of_week,
        dayDisplay: hour.day_display ?? hour.display_day ?? fallback.dayDisplay,
        openTime: normalizeTimeInput(hour.open_time) ?? fallback.openTime,
        closeTime: normalizeTimeInput(hour.close_time) ?? fallback.closeTime,
        isClosed: hour.is_closed,
      };
    }),
  };
}

export function buildRestaurantWriteFormData(
  values: RestaurantFormValues,
): FormData {
  const formData = new FormData();
  formData.append('name', values.name.trim());
  formData.append('category_ids', values.categoryId.trim());
  formData.append('description', values.description.trim());
  formData.append('address_line1', values.addressLine1.trim());
  formData.append('city', values.city.trim());
  formData.append('district', values.district.trim());
  formData.append('phone', values.phone.trim());
  formData.append('website', values.website.trim());
  formData.append('price_range', values.priceRange.trim() || '2');

  if (values.primaryPhotoFile) {
    formData.append('primary_photo', values.primaryPhotoFile);
  }

  values.openingHours.forEach((hour, index) => {
    formData.append(`opening_hours[${index}][day_of_week]`, String(hour.dayOfWeek));
    formData.append(`opening_hours[${index}][is_closed]`, String(hour.isClosed));

    if (!hour.isClosed) {
      formData.append(`opening_hours[${index}][open_time]`, hour.openTime);
      formData.append(`opening_hours[${index}][close_time]`, hour.closeTime);
    }
  });

  return formData;
}

function normalizeTimeInput(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) {
    return undefined;
  }

  return `${match[1].padStart(2, '0')}:${match[2]}`;
}
