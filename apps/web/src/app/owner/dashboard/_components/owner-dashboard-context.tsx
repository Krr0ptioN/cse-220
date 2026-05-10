'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import { AUTH_ENDPOINTS, sessionRequest, type User } from '@flavor-map/ui-module-auth';
import {
  API_ENDPOINTS,
  normalizeMenuItems,
  normalizeRestaurantPhotos,
  resolveApiAssetUrl,
  type MenuItem,
  type OwnerDashboardResponse,
  type OwnerDashboardRestaurant,
  type Restaurant,
  type RestaurantCategory,
  type RestaurantPhoto,
} from '@/lib/restaurants';
import {
  buildRestaurantWriteFormData,
  emptyRestaurantFormValues,
  restaurantToFormValues,
  type RestaurantFormValues,
} from '../_lib/owner-dashboard-utils';

type LoadState = 'loading' | 'ready' | 'access-denied' | 'error';

type DashboardRestaurantSource = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  city?: string;
  district?: string;
  address_line1?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone?: string;
  average_rating?: number | string | null;
  review_count?: number | string | null;
  price_range?: string;
  category?: RestaurantCategory;
  categories?: RestaurantCategory[];
  opening_hours?: Restaurant['opening_hours'];
  favorite_count?: number;
  favorite_score?: number;
  last_favorited_at?: string | null;
  is_favorite?: boolean;
  primary_photo_url?: string;
  photos?: RestaurantPhoto[];
  reviewer_stats?: OwnerDashboardRestaurant['reviewer_stats'];
  rating_progress?: OwnerDashboardRestaurant['rating_progress'];
};

type OwnerDashboardContextValue = {
  loadState: LoadState;
  user: User | null;
  dashboard: OwnerDashboardResponse | null;
  summary: OwnerDashboardResponse['summary'] | null;
  restaurants: OwnerDashboardRestaurant[];
  categories: RestaurantCategory[];
  selectedRestaurant: OwnerDashboardRestaurant | null;
  selectedRestaurantSlug: string | null;
  selectedRestaurantPreviewUrl: string | null;
  selectedRestaurantPhotoUrls: string[];
  formValues: RestaurantFormValues;
  editingSlug: string | null;
  message: string | null;
  error: string | null;
  loadWarning: string | null;
  isSubmitting: boolean;
  setSelectedRestaurantSlug: (slug: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateField: <K extends keyof RestaurantFormValues>(
    field: K,
    value: RestaurantFormValues[K],
  ) => void;
  editRestaurant: (restaurant: OwnerDashboardRestaurant) => void;
  resetForm: () => void;
  setPrimaryPhoto: (photo: RestaurantPhoto) => Promise<void>;
  deleteRestaurantPhoto: (photo: RestaurantPhoto) => Promise<void>;
};

const OwnerDashboardContext = createContext<OwnerDashboardContextValue | null>(null);

export function OwnerDashboardProvider({ children }: { children: ReactNode }) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<OwnerDashboardResponse | null>(null);
  const [restaurants, setRestaurants] = useState<OwnerDashboardRestaurant[]>([]);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [selectedRestaurantSlug, setSelectedRestaurantSlug] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<RestaurantFormValues>(() =>
    emptyRestaurantFormValues(),
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoadState('loading');
      setError(null);
      setLoadWarning(null);

      try {
        const currentUser = await sessionRequest<User>(AUTH_ENDPOINTS.me());
        if (ignore) return;

        setUser(currentUser);
        if (currentUser.role !== 'owner') {
          setLoadState('access-denied');
          return;
        }

        const [dashboardResult, categoriesResult] = await Promise.allSettled([
          sessionRequest<OwnerDashboardResponse>(API_ENDPOINTS.restaurants.dashboard()),
          sessionRequest<RestaurantCategory[]>(API_ENDPOINTS.categories.list()),
        ]);

        if (ignore) return;

        if (dashboardResult.status === 'fulfilled') {
          const ownerDashboard = dashboardResult.value;
          setDashboard(ownerDashboard);
          setRestaurants(ownerDashboard.restaurants.map(normalizeDashboardRestaurant));
          setSelectedRestaurantSlug(
            (current) => current ?? ownerDashboard.restaurants[0]?.slug ?? null,
          );
        } else {
          throw new Error('Unable to load owner analytics right now.');
        }

        if (categoriesResult.status === 'fulfilled') {
          const categoryList = categoriesResult.value.filter((category) => category.id);
          setCategories(categoryList);
          setFormValues((current) => ({
            ...current,
            categoryId: current.categoryId || categoryList[0]?.id || '',
          }));
        } else {
          setCategories([]);
          setLoadWarning('We could not load restaurant categories right now.');
        }

        setLoadState('ready');
      } catch (caught) {
        if (ignore) return;
        setError(caught instanceof Error ? caught.message : 'Unable to load dashboard.');
        setLoadState('error');
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!restaurants.length) {
      if (selectedRestaurantSlug !== null) {
        setSelectedRestaurantSlug(null);
      }
      return;
    }

    const selectedExists = restaurants.some(
      (restaurant) => restaurant.slug === selectedRestaurantSlug,
    );
    if (!selectedRestaurantSlug || !selectedExists) {
      setSelectedRestaurantSlug(restaurants[0].slug);
    }
  }, [restaurants, selectedRestaurantSlug]);

  useEffect(() => {
    if (!formValues.primaryPhotoFile) {
      setPhotoPreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(formValues.primaryPhotoFile);
    setPhotoPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [formValues.primaryPhotoFile]);

  const selectedRestaurant = useMemo(
    () =>
      restaurants.find((restaurant) => restaurant.slug === selectedRestaurantSlug) ??
      restaurants[0] ??
      null,
    [restaurants, selectedRestaurantSlug],
  );
  const selectedRestaurantPreviewUrl =
    photoPreviewUrl ||
    resolveApiAssetUrl(selectedRestaurant?.primary_photo_url) ||
    null;
  const selectedRestaurantPhotoUrls = selectedRestaurant
    ? [
        ...(photoPreviewUrl ? [photoPreviewUrl] : []),
        ...normalizeRestaurantPhotos(selectedRestaurant.photos ?? []).map((photo) => photo.url),
      ]
    : [];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload = buildRestaurantWriteFormData(formValues);
      const savedRestaurant = editingSlug
        ? await sessionRequest<Restaurant>(API_ENDPOINTS.restaurants.update(editingSlug), {
            method: 'PATCH',
            body: payload,
          })
        : await sessionRequest<Restaurant>(API_ENDPOINTS.restaurants.create(), {
            method: 'POST',
            body: payload,
          });
      const galleryPhotos = formValues.galleryPhotoFiles.length
        ? await uploadRestaurantPhotos(savedRestaurant.slug, formValues.galleryPhotoFiles)
        : [];
      const savedWithPhotos =
        galleryPhotos.length > 0
          ? {
              ...savedRestaurant,
              photos: [...(savedRestaurant.photos ?? []), ...galleryPhotos],
              primary_photo_url:
                galleryPhotos.find((photo) => photo.is_primary)?.url ??
                savedRestaurant.primary_photo_url,
            }
          : savedRestaurant;

      const nextRestaurant = editingSlug
        ? mergeDashboardRestaurant(
            restaurants.find((restaurant) => restaurant.slug === editingSlug) ?? null,
            savedWithPhotos,
          )
        : normalizeDashboardRestaurant(savedWithPhotos);

      if (editingSlug) {
        setRestaurants((current) =>
          current.map((restaurant) =>
            restaurant.slug === editingSlug ? nextRestaurant : restaurant,
          ),
        );
        setDashboard((current) =>
          current
            ? {
                ...current,
                restaurants: current.restaurants.map((restaurant) =>
                  restaurant.slug === editingSlug ? nextRestaurant : restaurant,
                ),
              }
            : current,
        );
      } else {
        setRestaurants((current) => [nextRestaurant, ...current]);
        setDashboard((current) =>
          current
            ? {
                ...current,
                summary: {
                  ...current.summary,
                  restaurant_count: current.summary.restaurant_count + 1,
                },
                restaurants: [nextRestaurant, ...current.restaurants],
              }
            : current,
        );
      }

      setSelectedRestaurantSlug(nextRestaurant.slug);
      setEditingSlug(null);
      setFormValues({
        ...emptyRestaurantFormValues(),
        categoryId: categories[0]?.id ?? '',
      });
      setMessage(editingSlug ? 'Listing updated.' : 'Listing created.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save listing.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof RestaurantFormValues>(
    field: K,
    value: RestaurantFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function editRestaurant(restaurant: OwnerDashboardRestaurant) {
    setSelectedRestaurantSlug(restaurant.slug);
    setEditingSlug(restaurant.slug);
    setFormValues(restaurantToFormValues(restaurant as Restaurant));
    setError(null);
    setMessage(null);
  }

  function resetForm() {
    setEditingSlug(null);
    setFormValues({
      ...emptyRestaurantFormValues(),
      categoryId: categories[0]?.id ?? '',
    });
    setError(null);
    setMessage(null);
  }

  async function setPrimaryPhoto(photo: RestaurantPhoto) {
    if (!selectedRestaurant) return;
    const updated = await sessionRequest<Restaurant>(
      API_ENDPOINTS.restaurants.primaryPhoto(selectedRestaurant.slug, photo.id),
      { method: 'POST' },
    );
    const nextRestaurant = mergeDashboardRestaurant(selectedRestaurant, updated);
    setRestaurants((current) =>
      current.map((restaurant) =>
        restaurant.slug === nextRestaurant.slug ? nextRestaurant : restaurant,
      ),
    );
    setMessage('Primary photo updated.');
  }

  async function deleteRestaurantPhoto(photo: RestaurantPhoto) {
    if (!selectedRestaurant) return;
    await sessionRequest<void>(API_ENDPOINTS.restaurants.photo(selectedRestaurant.slug, photo.id), {
      method: 'DELETE',
    });
    const remainingPhotos = (selectedRestaurant.photos ?? []).filter(
      (candidate) => candidate.id !== photo.id,
    );
    const nextPrimary =
      remainingPhotos.find((candidate) => candidate.is_primary) ?? remainingPhotos[0];
    const nextRestaurant = {
      ...selectedRestaurant,
      photos: remainingPhotos,
      primary_photo_url: nextPrimary?.url ?? '',
    };
    setRestaurants((current) =>
      current.map((restaurant) =>
        restaurant.slug === nextRestaurant.slug ? nextRestaurant : restaurant,
      ),
    );
    setMessage('Photo deleted.');
  }

  const value = useMemo<OwnerDashboardContextValue>(
    () => ({
      loadState,
      user,
      dashboard,
      summary: dashboard?.summary ?? null,
      restaurants,
      categories,
      selectedRestaurant,
      selectedRestaurantSlug,
      selectedRestaurantPreviewUrl,
      selectedRestaurantPhotoUrls,
      formValues,
      editingSlug,
      message,
      error,
      loadWarning,
      isSubmitting,
      setSelectedRestaurantSlug,
      onSubmit,
      updateField,
      editRestaurant,
      resetForm,
      setPrimaryPhoto,
      deleteRestaurantPhoto,
    }),
    [
      loadState,
      user,
      dashboard,
      restaurants,
      categories,
      selectedRestaurant,
      selectedRestaurantSlug,
      selectedRestaurantPreviewUrl,
      selectedRestaurantPhotoUrls,
      formValues,
      editingSlug,
      message,
      error,
      loadWarning,
      isSubmitting,
    ],
  );

  return (
    <OwnerDashboardContext.Provider value={value}>
      {children}
    </OwnerDashboardContext.Provider>
  );
}

export function useOwnerDashboard() {
  const value = useContext(OwnerDashboardContext);
  if (!value) {
    throw new Error('useOwnerDashboard must be used inside OwnerDashboardProvider.');
  }
  return value;
}

export function formatOwnerRating(value: unknown): string {
  const rating = toFiniteNumber(value);
  return rating === undefined ? 'No reviews' : rating.toFixed(1);
}

export function formatOwnerReviewCount(value: unknown): string {
  return String(toNonNegativeInt(value));
}

export function toOwnerFiniteNumber(value: unknown): number | undefined {
  return toFiniteNumber(value);
}

function toNonNegativeInt(value: unknown): number {
  const numeric = toFiniteNumber(value);
  if (numeric === undefined) {
    return 0;
  }

  return Math.max(0, Math.floor(numeric));
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeDashboardRestaurant(
  restaurant: DashboardRestaurantSource,
): OwnerDashboardRestaurant {
  const categories = restaurant.categories ?? [];
  const category = restaurant.category ?? categories[0];

  return {
    ...restaurant,
    category,
    categories,
    opening_hours: restaurant.opening_hours ?? [],
    favorite_count: toNonNegativeInt(restaurant.favorite_count),
    favorite_score: toNonNegativeInt(restaurant.favorite_score),
    last_favorited_at: restaurant.last_favorited_at ?? null,
    is_favorite: Boolean(restaurant.is_favorite),
    average_rating: toFiniteNumber(restaurant.average_rating) ?? null,
    review_count: toNonNegativeInt(restaurant.review_count),
    reviewer_stats: restaurant.reviewer_stats ?? [],
    rating_progress: (restaurant.rating_progress ?? []).map((point) => ({
      ...point,
      average_rating: toFiniteNumber(point.average_rating) ?? null,
      review_count: toNonNegativeInt(point.review_count),
      cumulative_average_rating: toFiniteNumber(point.cumulative_average_rating) ?? null,
      cumulative_review_count: toNonNegativeInt(point.cumulative_review_count),
    })),
  };
}

function mergeDashboardRestaurant(
  existing: OwnerDashboardRestaurant | null,
  incoming: DashboardRestaurantSource,
): OwnerDashboardRestaurant {
  const categories = incoming.categories ?? existing?.categories ?? [];
  const category = incoming.category ?? categories[0] ?? existing?.category;

  return {
    ...incoming,
    category,
    categories,
    opening_hours: incoming.opening_hours ?? existing?.opening_hours ?? [],
    favorite_count: toNonNegativeInt(incoming.favorite_count ?? existing?.favorite_count),
    favorite_score: toNonNegativeInt(incoming.favorite_score ?? existing?.favorite_score),
    last_favorited_at: incoming.last_favorited_at ?? existing?.last_favorited_at ?? null,
    is_favorite: Boolean(incoming.is_favorite ?? existing?.is_favorite),
    average_rating: toFiniteNumber(incoming.average_rating) ?? null,
    review_count: toNonNegativeInt(incoming.review_count),
    reviewer_stats: existing?.reviewer_stats ?? [],
    rating_progress: existing?.rating_progress ?? [],
  };
}

async function uploadRestaurantPhotos(
  restaurantSlug: string,
  files: File[],
): Promise<RestaurantPhoto[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));

  const payload = await sessionRequest<unknown>(
    API_ENDPOINTS.restaurants.photos(restaurantSlug),
    {
      method: 'POST',
      body: formData,
    },
  );

  return normalizeRestaurantPhotos(payload);
}

export function normalizeOwnerMenuItems(payload: unknown): MenuItem[] {
  return normalizeMenuItems(payload);
}
