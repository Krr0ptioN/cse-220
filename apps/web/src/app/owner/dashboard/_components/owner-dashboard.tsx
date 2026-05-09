'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Input,
  NativeSelect,
  NativeSelectOption,
  Switch,
  Textarea,
  cn,
} from 'ui-common';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  RiAddCircleLine,
  RiArrowRightLine,
  RiBarChart2Line,
  RiBookmarkLine,
  RiCalendarLine,
  RiChat3Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiFileList3Line,
  RiImageLine,
  RiPencilLine,
  RiRestaurant2Line,
  RiPhoneLine,
  RiRestaurantLine,
  RiStarLine,
  RiStore2Line,
  RiUser3Line,
} from '@remixicon/react';

import { sessionRequest } from '@/app/(auth)/auth/_lib/auth-api';
import {
  API_ENDPOINTS,
  getRestaurantImageUrl,
  normalizeMenuItems,
  resolveApiAssetUrl,
  type MenuItem,
  type OwnerDashboardResponse,
  type OwnerDashboardRestaurant,
  type Restaurant,
  type RestaurantCategory,
  type User,
} from '@/lib/restaurants';
import { fetchRestaurantReviews, submitReview, type Review } from '@/lib/reviews';
import {
  buildRestaurantWriteFormData,
  emptyRestaurantFormValues,
  restaurantToFormValues,
  type RestaurantFormValues,
} from '../_lib/owner-dashboard-utils';
import { OwnerListingForm } from './owner-listing-form';

type LoadState = 'loading' | 'ready' | 'access-denied' | 'error';
type MenuLoadState = 'idle' | 'loading' | 'ready' | 'error';
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
  reviewer_stats?: OwnerDashboardRestaurant['reviewer_stats'];
  rating_progress?: OwnerDashboardRestaurant['rating_progress'];
};

type MenuItemFormValues = {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  currency: string;
  sortOrder: string;
  isAvailable: boolean;
};

export function OwnerDashboard() {
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
        const currentUser = await sessionRequest<User>(API_ENDPOINTS.auth.me());
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
          setSelectedRestaurantSlug((current) => current ?? ownerDashboard.restaurants[0]?.slug ?? null);
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
          setLoadWarning((current) =>
            current ?? 'We could not load restaurant categories right now.',
          );
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

  const summary = dashboard?.summary ?? null;
  const selectedRestaurant = useMemo(
    () =>
      restaurants.find((restaurant) => restaurant.slug === selectedRestaurantSlug) ??
      restaurants[0] ??
      null,
    [restaurants, selectedRestaurantSlug],
  );
  const selectedRestaurantIndex = selectedRestaurant
    ? restaurants.findIndex((restaurant) => restaurant.slug === selectedRestaurant.slug) + 1
    : 0;
  const selectedRestaurantPreviewUrl =
    photoPreviewUrl ||
    resolveApiAssetUrl(selectedRestaurant?.primary_photo_url) ||
    (selectedRestaurant ? getRestaurantImageUrl(selectedRestaurant) : null);
  const selectedRestaurantSeries = useMemo(() => {
    const series = selectedRestaurant?.rating_progress ?? [];
    return series.map((point) => ({
      month: point.month,
      monthLabel: format(parseISO(point.month), 'MMM yyyy'),
      monthlyAverage: point.average_rating,
      cumulativeAverage: point.cumulative_average_rating,
      reviewCount: point.review_count,
      cumulativeReviewCount: point.cumulative_review_count,
    }));
  }, [selectedRestaurant]);
  const globalReviewers = dashboard?.reviewers ?? [];
  const selectedRestaurantReviewers = selectedRestaurant?.reviewer_stats ?? [];
  const latestSeriesPoint = selectedRestaurantSeries[selectedRestaurantSeries.length - 1] ?? null;

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

      const nextRestaurant = editingSlug
        ? mergeDashboardRestaurant(
            restaurants.find((restaurant) => restaurant.slug === editingSlug) ?? null,
            savedRestaurant,
          )
        : normalizeDashboardRestaurant(savedRestaurant);

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

  if (loadState === 'loading') {
    return <DashboardShell title="Loading dashboard" description="Fetching your owner workspace." />;
  }

  if (loadState === 'access-denied') {
    return (
      <DashboardShell
        title="Business access required"
        description="Sign in with a restaurant owner account to manage listings."
      >
        <Button asChild>
          <Link href="/business/sign-in" className="inline-flex items-center gap-1">
            Open business sign in
            <RiArrowRightLine className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </DashboardShell>
    );
  }

  if (loadState === 'error') {
    return (
      <DashboardShell
        title="Dashboard unavailable"
        description={error ?? 'Unable to load dashboard.'}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-foreground">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)]">
        <SidebarNav />

        <div className="min-w-0 border-l border-border/70 bg-background">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur sm:px-8">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Open public listings">
              <Link href="/restaurants">
                <RiArrowRightLine className="size-4 rotate-180" aria-hidden="true" />
              </Link>
            </Button>
            <span className="text-sm font-medium text-muted-foreground">Restaurants</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-sm font-semibold">Owner workspace</span>
          </header>

          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15 sm:size-24">
                  <RiStore2Line className="size-10" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                      {selectedRestaurant?.name || user?.display_name || 'Restaurant profile'}
                    </h1>
                    <Badge variant="secondary">Owner dashboard</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-medium text-muted-foreground">
                    <ProfileAction icon={<RiChat3Line className="size-4" />} label="Start a conversation" />
                    <ProfileAction icon={<RiCalendarLine className="size-4" />} label="Schedule reminder" />
                    <ProfileAction icon={<RiFileList3Line className="size-4" />} label="Add a note" />
                    <ProfileAction icon={<RiPhoneLine className="size-4" />} label="Call restaurant" />
                  </div>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href="/restaurants" className="inline-flex items-center gap-1">
                  View public listings
                  <RiArrowRightLine className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </section>

            <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="border-b border-border/70">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <RiStore2Line className="size-4 text-muted-foreground" aria-hidden="true" />
                        Restaurant details
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Create listing"
                        onClick={resetForm}
                      >
                        <RiAddCircleLine className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/70 px-0">
                    <div className="space-y-4 px-5 py-4">
                      <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                        <AspectRatio ratio={16 / 10}>
                          {selectedRestaurantPreviewUrl ? (
                            <img
                              src={selectedRestaurantPreviewUrl}
                              alt={selectedRestaurant?.name || 'Restaurant preview'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,oklch(0.98_0.01_90),oklch(0.94_0.02_86))] text-muted-foreground">
                              <RiImageLine className="size-12" aria-hidden="true" />
                            </div>
                          )}
                        </AspectRatio>
                      </div>
                      <DetailRow
                        label="Restaurant name"
                        value={selectedRestaurant?.name || 'Not created yet'}
                      />
                      <DetailRow
                        label="Category"
                        value={selectedRestaurant?.category?.name || 'Select category'}
                      />
                      <DetailRow
                        label="City"
                        value={selectedRestaurant?.city || formValues.city || 'Istanbul'}
                      />
                      <DetailRow
                        label="District"
                        value={selectedRestaurant?.district || formValues.district || 'Not set'}
                      />
                      <DetailRow
                        label="Photo"
                        value={
                          formValues.primaryPhotoFile?.name ||
                          (selectedRestaurant?.primary_photo_url
                            ? 'Current primary photo'
                            : 'Upload a photo')
                        }
                      />
                    </div>
                    <div className="space-y-4 px-5 py-4">
                      <DetailRow
                        label="Rating"
                        value={summary?.average_rating === null ? 'No reviews' : formatRating(summary?.average_rating)}
                      />
                      <DetailRow label="Reviews" value={String(summary?.review_count ?? 0)} />
                      <DetailRow
                        label="Owned listings"
                        value={String(summary?.restaurant_count ?? restaurants.length)}
                      />
                    </div>
                    <div className="space-y-4 px-5 py-4">
                      <DetailRow
                        label="Phone"
                        value={selectedRestaurant?.phone || formValues.phone || 'Add phone'}
                      />
                      <DetailRow
                        label="Website"
                        value={selectedRestaurant?.website || formValues.website || 'Add website'}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="border-b border-border/70">
                    <CardTitle className="flex items-center gap-2">
                      <RiUser3Line className="size-4 text-muted-foreground" aria-hidden="true" />
                      Owner contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DetailRow label="Name" value={user?.display_name || 'Restaurant owner'} />
                    <DetailRow label="Email" value={user?.email || 'Signed in'} />
                    <DetailRow label="Role" value="Owner" />
                  </CardContent>
                </Card>
              </aside>

              <div className="min-w-0 space-y-5">
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <MetricCard
                    icon={<RiStore2Line className="size-4" aria-hidden="true" />}
                    label="Owned listings"
                    value={String(summary?.restaurant_count ?? restaurants.length)}
                  />
                  <MetricCard
                    icon={<RiStarLine className="size-4" aria-hidden="true" />}
                    label="Average rating"
                    value={summary?.average_rating === null ? 'No reviews' : formatRating(summary?.average_rating)}
                  />
                  <MetricCard
                    icon={<RiBarChart2Line className="size-4" aria-hidden="true" />}
                    label="Review count"
                    value={String(summary?.review_count ?? 0)}
                  />
                  <MetricCard
                    icon={<RiBookmarkLine className="size-4" aria-hidden="true" />}
                    label="Total saves"
                    value={String(summary?.favorite_count ?? 0)}
                  />
                  <MetricCard
                    icon={<RiBarChart2Line className="size-4" aria-hidden="true" />}
                    label="Save momentum"
                    value={String(selectedRestaurant?.favorite_score ?? 0)}
                  />
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.76fr)]">
                  <Card className="border border-border/70 bg-card shadow-sm">
                    <CardHeader className="space-y-2 border-b border-border/70">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <RiBarChart2Line className="size-4 text-muted-foreground" aria-hidden="true" />
                            Average rating progress
                          </CardTitle>
                          <CardDescription>
                            Track monthly and cumulative rating movement for one restaurant.
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{selectedRestaurant?.review_count ?? 0} reviews</Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                        <div className="space-y-2">
                          <label htmlFor="focus-restaurant" className="text-xs font-medium">
                            Focus restaurant
                          </label>
                          <NativeSelect
                            id="focus-restaurant"
                            value={selectedRestaurant?.slug ?? ''}
                            onChange={(event) => setSelectedRestaurantSlug(event.target.value)}
                            className="w-full"
                          >
                            {restaurants.map((restaurant) => (
                              <NativeSelectOption key={restaurant.slug} value={restaurant.slug}>
                                {restaurant.name}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            Avg {formatRating(selectedRestaurant?.average_rating)}
                          </Badge>
                          <Badge variant="outline">
                            Rank #{selectedRestaurantIndex || '—'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-5">
                      {selectedRestaurantSeries.length ? (
                        <>
                          <ChartContainer
                            config={{
                              monthlyAverage: {
                                label: 'Monthly average',
                                color: 'hsl(214 95% 55%)',
                              },
                              cumulativeAverage: {
                                label: 'Cumulative average',
                                color: 'hsl(160 84% 39%)',
                              },
                            }}
                            className="h-[320px] w-full"
                          >
                            <LineChart data={selectedRestaurantSeries} margin={{ left: 8, right: 8, top: 12, bottom: 4 }}>
                              <CartesianGrid vertical={false} strokeDasharray="3 3" />
                              <XAxis
                                dataKey="monthLabel"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                minTickGap={24}
                              />
                              <YAxis
                                domain={[0, 5]}
                                tickCount={6}
                                tickLine={false}
                                axisLine={false}
                                width={32}
                              />
                              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                              <Line
                                type="monotone"
                                dataKey="monthlyAverage"
                                stroke="var(--color-monthlyAverage)"
                                strokeWidth={2.5}
                                dot={false}
                              />
                              <Line
                                type="monotone"
                                dataKey="cumulativeAverage"
                                stroke="var(--color-cumulativeAverage)"
                                strokeWidth={2.5}
                                dot={false}
                              />
                            </LineChart>
                          </ChartContainer>
                          <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Latest month</p>
                              <p className="text-sm font-semibold">
                                {latestSeriesPoint?.monthLabel ?? 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Cumulative rating</p>
                              <p className="text-sm font-semibold">
                                {formatRating(latestSeriesPoint?.cumulativeAverage)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Monthly reviews</p>
                              <p className="text-sm font-semibold">
                                {String(latestSeriesPoint?.reviewCount ?? 0)}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                          No rating history yet for this restaurant. Add reviews to start the trend line.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-border/70 bg-card shadow-sm">
                    <CardHeader className="border-b border-border/70">
                      <CardTitle className="flex items-center gap-2">
                        <RiUser3Line className="size-4 text-muted-foreground" aria-hidden="true" />
                        Reviewer stats
                      </CardTitle>
                      <CardDescription>
                        Global reviewer leaderboard and selected-restaurant participation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 p-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Global reviewers
                          </p>
                          <Badge variant="secondary">{globalReviewers.length} reviewers</Badge>
                        </div>
                        {globalReviewers.length ? (
                          <div className="space-y-2">
                            {globalReviewers.slice(0, 4).map((reviewer) => (
                              <ReviewerStatRow key={reviewer.id} reviewer={reviewer} />
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                            No reviewer data yet.
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Selected restaurant reviewers
                          </p>
                          <Badge variant="secondary">{selectedRestaurantReviewers.length} reviewers</Badge>
                        </div>
                        {selectedRestaurantReviewers.length ? (
                          <div className="space-y-2">
                            {selectedRestaurantReviewers.slice(0, 4).map((reviewer) => (
                              <ReviewerStatRow key={reviewer.id} reviewer={reviewer} />
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                            This restaurant has not built a reviewer profile yet.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <OwnerMenuManagement
                  restaurant={selectedRestaurant}
                  categories={categories}
                />

                <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)]">
                  <OwnerListingForm
                    categories={categories}
                    editingSlug={editingSlug}
                    formValues={formValues}
                    isSubmitting={isSubmitting}
                    loadWarning={loadWarning}
                    message={message}
                    error={error}
                    onSubmit={onSubmit}
                    onCancelEdit={resetForm}
                    onUpdateField={updateField}
                  />

                  <div className="space-y-4">
                    <Card className="border border-border/70 bg-card/90 shadow-sm backdrop-blur">
                      <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle>Owned listings</CardTitle>
                          <CardDescription>
                            Average rating and review volume for each restaurant.
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{restaurants.length} total</Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {restaurants.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                            No restaurants yet. Create your first listing with the form.
                          </div>
                        ) : (
                          restaurants.map((restaurant) => (
                            <article
                              key={restaurant.id}
                              className={cn(
                                'rounded-lg border p-3 transition-colors',
                                restaurant.slug === selectedRestaurant?.slug
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'border-border/70',
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <h2 className="truncate text-sm font-medium">
                                    {restaurant.name}
                                  </h2>
                                  <p className="text-xs text-muted-foreground">
                                    {[restaurant.category?.name, restaurant.city, restaurant.district]
                                      .filter(Boolean)
                                      .join(' / ')}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editRestaurant(restaurant)}
                                >
                                  <RiPencilLine className="size-3" aria-hidden="true" />
                                  Edit
                                </Button>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <span>Rating: {formatRating(restaurant.average_rating)}</span>
                                <span>Reviews: {formatReviewCount(restaurant.review_count)}</span>
                                <span>Saves: {restaurant.favorite_count ?? 0}</span>
                                <span>Momentum: {restaurant.favorite_score ?? 0}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-[11px]">
                                  {restaurant.rating_progress.length ? 'Trending' : 'Fresh'}
                                </Badge>
                                <Badge variant="outline" className="text-[11px]">
                                  {restaurant.reviewer_stats.length} reviewers
                                </Badge>
                              </div>
                            </article>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <OwnerReviewReplies restaurant={selectedRestaurant} />
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function OwnerReviewReplies({
  restaurant,
}: {
  restaurant: Pick<OwnerDashboardRestaurant, 'slug'> | null;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!restaurant) {
      setReviews([]);
      return;
    }

    const selectedRestaurant = restaurant;
    let ignore = false;

    async function loadReviews() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchRestaurantReviews(selectedRestaurant.slug, 1, 5);
        if (!ignore) {
          setReviews(response.data);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load recent reviews.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadReviews();
    return () => {
      ignore = true;
    };
  }, [restaurant]);

  async function submitReply(review: Review) {
    if (!restaurant) return;

    const content = (replyDrafts[review.id] ?? '').trim();
    if (!content) {
      setError('Write a reply before sending.');
      return;
    }

    setSubmittingId(review.id);
    setError(null);
    setMessage(null);

    const result = await submitReview(restaurant.slug, review.rating, content, review.id);

    if (result.success && result.review) {
      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? { ...item, replies: [...(item.replies ?? []), result.review as Review] }
            : item,
        ),
      );
      setReplyDrafts((current) => ({ ...current, [review.id]: '' }));
      setMessage('Reply posted.');
    } else {
      setError(result.error || 'Unable to post reply.');
    }

    setSubmittingId(null);
  }

  const openReviews = reviews.filter(
    (review) => !review.replies?.some((reply) => reply.is_business_answer),
  );

  return (
    <Card className="border border-border/70 bg-card/90 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle>Review replies</CardTitle>
        <CardDescription>
          Respond to recent diner reviews for the selected restaurant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!restaurant ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Create or select a restaurant before replying to reviews.
          </div>
        ) : isLoading ? (
          <div className="space-y-2 text-sm text-muted-foreground">Loading recent reviews...</div>
        ) : openReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No unreplied reviews right now.
          </div>
        ) : (
          openReviews.map((review) => (
            <article key={review.id} className="space-y-3 rounded-lg border border-border/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{review.user.display_name}</p>
                  <p className="text-xs text-muted-foreground">{review.content}</p>
                </div>
                <Badge variant="secondary">{review.rating}/5</Badge>
              </div>
              <Textarea
                value={replyDrafts[review.id] ?? ''}
                onChange={(event) =>
                  setReplyDrafts((current) => ({
                    ...current,
                    [review.id]: event.target.value,
                  }))
                }
                placeholder="Write an owner reply..."
                className="min-h-20 text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingId === review.id}
                  onClick={() => void submitReply(review)}
                >
                  {submittingId === review.id ? 'Posting...' : 'Post reply'}
                </Button>
              </div>
            </article>
          ))
        )}
        {message && <p className="text-xs text-primary">{message}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

function OwnerMenuManagement({
  restaurant,
  categories,
}: {
  restaurant: Pick<OwnerDashboardRestaurant, 'slug' | 'name'> | null;
  categories: RestaurantCategory[];
}) {
  const defaultCategoryId = categories[0]?.id ?? '';
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadState, setLoadState] = useState<MenuLoadState>('idle');
  const [formValues, setFormValues] = useState<MenuItemFormValues>(() =>
    emptyMenuItemFormValues(defaultCategoryId),
  );
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formValues.categoryId && defaultCategoryId) {
      setFormValues((current) => ({ ...current, categoryId: defaultCategoryId }));
    }
  }, [defaultCategoryId, formValues.categoryId]);

  useEffect(() => {
    setEditingMenuItemId(null);
    setMessage(null);
    setError(null);
    setFormValues(emptyMenuItemFormValues(defaultCategoryId));

    if (!restaurant) {
      setMenuItems([]);
      setLoadState('idle');
      return;
    }

    const selectedRestaurant = restaurant;
    let ignore = false;

    async function loadMenuItems() {
      setLoadState('loading');

      try {
        const payload = await sessionRequest<unknown>(
          API_ENDPOINTS.restaurants.menuItems(selectedRestaurant.slug),
        );
        if (!ignore) {
          setMenuItems(normalizeMenuItems(payload));
          setLoadState('ready');
        }
      } catch (caught) {
        if (!ignore) {
          setError(caught instanceof Error ? caught.message : 'Unable to load menu items.');
          setLoadState('error');
        }
      }
    }

    void loadMenuItems();
    return () => {
      ignore = true;
    };
  }, [restaurant, defaultCategoryId]);

  function updateMenuField<K extends keyof MenuItemFormValues>(
    field: K,
    value: MenuItemFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function editMenuItem(menuItem: MenuItem) {
    setEditingMenuItemId(menuItem.id);
    setFormValues(menuItemToFormValues(menuItem, defaultCategoryId));
    setMessage(null);
    setError(null);
  }

  function resetMenuForm() {
    setEditingMenuItemId(null);
    setFormValues(emptyMenuItemFormValues(defaultCategoryId));
    setMessage(null);
    setError(null);
  }

  async function submitMenuItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!restaurant) {
      setError('Select a restaurant before editing its menu.');
      return;
    }

    if (!formValues.categoryId) {
      setError('Select a category before saving this menu item.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const endpoint = editingMenuItemId
        ? API_ENDPOINTS.restaurants.menuItem(restaurant.slug, editingMenuItemId)
        : API_ENDPOINTS.restaurants.menuItems(restaurant.slug);
      const payload = await sessionRequest<unknown>(endpoint, {
        method: editingMenuItemId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildMenuItemPayload(formValues)),
      });
      const savedMenuItem = normalizeMenuItems([payload])[0];

      if (!savedMenuItem) {
        throw new Error('The menu item response was invalid.');
      }

      setMenuItems((current) =>
        sortMenuItems(
          editingMenuItemId
            ? current.map((item) =>
                item.id === editingMenuItemId ? savedMenuItem : item,
              )
            : [savedMenuItem, ...current],
        ),
      );
      setEditingMenuItemId(null);
      setFormValues(emptyMenuItemFormValues(defaultCategoryId));
      setMessage(editingMenuItemId ? 'Menu item updated.' : 'Menu item added.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save menu item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMenuItem(menuItem: MenuItem) {
    if (!restaurant) return;

    const shouldDelete = window.confirm(`Delete "${menuItem.name}" from the menu?`);
    if (!shouldDelete) {
      return;
    }

    setDeletingMenuItemId(menuItem.id);
    setMessage(null);
    setError(null);

    try {
      await sessionRequest<void>(
        API_ENDPOINTS.restaurants.menuItem(restaurant.slug, menuItem.id),
        { method: 'DELETE' },
      );
      setMenuItems((current) => current.filter((item) => item.id !== menuItem.id));
      if (editingMenuItemId === menuItem.id) {
        resetMenuForm();
      }
      setMessage('Menu item deleted.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete menu item.');
    } finally {
      setDeletingMenuItemId(null);
    }
  }

  const availableItems = menuItems.filter((item) => item.is_available).length;
  const categoryCount = new Set(
    menuItems.map((item) => item.category?.id ?? item.category?.name).filter(Boolean),
  ).size;

  return (
    <Card className="border border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <RiRestaurant2Line className="size-4 text-muted-foreground" aria-hidden="true" />
            Menu management
          </CardTitle>
          <CardDescription>
            Create, update, and remove dishes for the selected restaurant.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{menuItems.length} items</Badge>
          <Badge variant="outline">{availableItems} available</Badge>
          <Badge variant="outline">{categoryCount} categories</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {!restaurant ? (
          <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
            Create or select a restaurant before managing menu items.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{restaurant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Public menu items appear on the restaurant detail page.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetMenuForm}
                  disabled={submitting}
                >
                  <RiAddCircleLine className="size-3" aria-hidden="true" />
                  New item
                </Button>
              </div>

              {loadState === 'loading' ? (
                <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                  Loading menu items...
                </div>
              ) : loadState === 'error' ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
                  {error ?? 'Unable to load menu items.'}
                </div>
              ) : menuItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                  No menu items yet. Add the first dish, drink, or special for this listing.
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((menuItem) => (
                    <article
                      key={menuItem.id}
                      className={cn(
                        'grid gap-3 rounded-xl border border-border/70 bg-background p-3 transition-colors sm:grid-cols-[72px_minmax(0,1fr)_auto]',
                        editingMenuItemId === menuItem.id && 'border-primary/40 bg-primary/5',
                      )}
                    >
                      <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                        <AspectRatio ratio={1}>
                          {menuItem.image_url ? (
                            <img
                              src={menuItem.image_url}
                              alt={menuItem.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <RiRestaurant2Line className="size-7" aria-hidden="true" />
                            </div>
                          )}
                        </AspectRatio>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold">{menuItem.name}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {menuItem.description || 'No description yet.'}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">
                            {formatMenuPrice(menuItem.price, menuItem.currency)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[11px]">
                            {menuItem.category?.name ?? 'Uncategorized'}
                          </Badge>
                          <Badge
                            variant={menuItem.is_available ? 'secondary' : 'outline'}
                            className="text-[11px]"
                          >
                            {menuItem.is_available ? (
                              <RiCheckboxCircleLine className="mr-1 size-3" aria-hidden="true" />
                            ) : (
                              <RiCloseCircleLine className="mr-1 size-3" aria-hidden="true" />
                            )}
                            {menuItem.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            Sort {menuItem.sort_order}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 sm:flex-col">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => editMenuItem(menuItem)}
                          disabled={submitting}
                        >
                          <RiPencilLine className="size-3" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteMenuItem(menuItem)}
                          disabled={deletingMenuItemId === menuItem.id}
                        >
                          <RiDeleteBinLine className="size-3" aria-hidden="true" />
                          {deletingMenuItemId === menuItem.id ? 'Deleting' : 'Delete'}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <form
              className="space-y-4 rounded-xl border border-border/70 bg-muted/10 p-4"
              onSubmit={submitMenuItem}
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {editingMenuItemId ? 'Edit menu item' : 'Add menu item'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Menu data is saved directly to the selected restaurant.
                </p>
              </div>

              <TextField
                id="menu-item-name"
                label="Item name"
                value={formValues.name}
                onChange={(value) => updateMenuField('name', value)}
                placeholder="Seasonal mezze plate"
                disabled={submitting}
                required
              />

              <div className="space-y-2">
                <label htmlFor="menu-item-description" className="text-xs font-medium">
                  Description
                </label>
                <Textarea
                  id="menu-item-description"
                  value={formValues.description}
                  onChange={(event) => updateMenuField('description', event.target.value)}
                  placeholder="Ingredients, preparation style, and pairing notes."
                  disabled={submitting}
                  className="min-h-24 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="menu-item-category" className="text-xs font-medium">
                  Category
                </label>
                <NativeSelect
                  id="menu-item-category"
                  value={formValues.categoryId}
                  onChange={(event) => updateMenuField('categoryId', event.target.value)}
                  disabled={submitting || categories.length === 0}
                  required
                  className="w-full"
                >
                  <NativeSelectOption value="" disabled>
                    Select category
                  </NativeSelectOption>
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px]">
                <TextField
                  id="menu-item-price"
                  label="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.price}
                  onChange={(value) => updateMenuField('price', value)}
                  placeholder="12.50"
                  disabled={submitting}
                  required
                />
                <div className="space-y-2">
                  <label htmlFor="menu-item-currency" className="text-xs font-medium">
                    Currency
                  </label>
                  <NativeSelect
                    id="menu-item-currency"
                    value={formValues.currency}
                    onChange={(event) => updateMenuField('currency', event.target.value)}
                    disabled={submitting}
                    className="w-full"
                  >
                    <NativeSelectOption value="EUR">EUR</NativeSelectOption>
                    <NativeSelectOption value="TRY">TRY</NativeSelectOption>
                    <NativeSelectOption value="USD">USD</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>

              <TextField
                id="menu-item-sort-order"
                label="Sort order"
                type="number"
                min="0"
                step="1"
                value={formValues.sortOrder}
                onChange={(value) => updateMenuField('sortOrder', value)}
                placeholder="0"
                disabled={submitting}
              />

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
                <span>
                  <span className="block text-xs font-medium">Available</span>
                  <span className="block text-xs text-muted-foreground">
                    Hide an item temporarily without deleting it.
                  </span>
                </span>
                <Switch
                  checked={formValues.isAvailable}
                  onCheckedChange={(checked) => updateMenuField('isAvailable', checked)}
                  disabled={submitting}
                />
              </label>

              {message && <p className="text-xs text-primary">{message}</p>}
              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting || categories.length === 0}>
                  {submitting
                    ? 'Saving...'
                    : editingMenuItemId
                      ? 'Update item'
                      : 'Add item'}
                </Button>
                {editingMenuItemId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetMenuForm}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
      <Card className="w-full border border-border/70">
        <CardHeader className="space-y-2">
          <Badge variant="secondary">Owner dashboard</Badge>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
      </Card>
    </main>
  );
}

function SidebarNav() {
  const items = [
    { label: 'Overview', icon: <RiRestaurantLine className="size-5" aria-hidden="true" />, active: true },
    { label: 'Listings', icon: <RiStore2Line className="size-5" aria-hidden="true" /> },
    { label: 'Menu', icon: <RiRestaurantLine className="size-5" aria-hidden="true" /> },
    { label: 'Hours', icon: <RiCalendarLine className="size-5" aria-hidden="true" /> },
    { label: 'Location', icon: <RiRestaurantLine className="size-5" aria-hidden="true" /> },
    { label: 'Reviews', icon: <RiStarLine className="size-5" aria-hidden="true" /> },
    { label: 'Analytics', icon: <RiBarChart2Line className="size-5" aria-hidden="true" /> },
  ];

  return (
    <aside className="hidden min-h-screen border-r border-border/70 bg-card md:block">
      <div className="flex h-16 items-center justify-center border-b border-border/70">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <RiRestaurantLine className="size-5" aria-hidden="true" />
        </span>
      </div>
      <nav className="flex flex-col items-center gap-3 py-5" aria-label="Owner workspace">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
            disabled={!item.active}
            className={cn(
              'flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors',
              item.active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55',
            )}
          >
            {item.icon}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function ProfileAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate font-semibold text-foreground">{value}</span>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border border-border/70 bg-card/90 shadow-sm backdrop-blur" size="sm">
      <CardContent className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span>
          <span className="block text-[0.7rem] text-muted-foreground">{label}</span>
          <span className="text-lg font-semibold tracking-tight">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function ReviewerStatRow({ reviewer }: { reviewer: OwnerDashboardResponse['reviewers'][number] }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{reviewer.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {reviewer.review_count} reviews • {reviewer.restaurant_count} restaurants
          </p>
        </div>
        <Badge variant="secondary">{formatRating(reviewer.average_rating)}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Last active {formatRelativeDate(reviewer.last_review_at)}
      </p>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  step,
  disabled,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}

function emptyMenuItemFormValues(categoryId = ''): MenuItemFormValues {
  return {
    name: '',
    description: '',
    categoryId,
    price: '',
    currency: 'EUR',
    sortOrder: '0',
    isAvailable: true,
  };
}

function menuItemToFormValues(
  menuItem: MenuItem,
  fallbackCategoryId = '',
): MenuItemFormValues {
  return {
    name: menuItem.name,
    description: menuItem.description ?? '',
    categoryId: menuItem.category?.id ?? fallbackCategoryId,
    price: String(menuItem.price),
    currency: menuItem.currency || 'EUR',
    sortOrder: String(menuItem.sort_order),
    isAvailable: menuItem.is_available,
  };
}

function buildMenuItemPayload(values: MenuItemFormValues) {
  const sortOrder = Number(values.sortOrder);

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category_id: values.categoryId,
    price: values.price.trim(),
    currency: values.currency.trim().toUpperCase() || 'EUR',
    is_available: values.isAvailable,
    sort_order: Number.isFinite(sortOrder) ? Math.max(0, Math.floor(sortOrder)) : 0,
  };
}

function sortMenuItems(menuItems: MenuItem[]): MenuItem[] {
  return [...menuItems].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order;
    }

    return first.name.localeCompare(second.name);
  });
}

function formatMenuPrice(value: unknown, currency: string): string {
  const amount = toFiniteNumber(value) ?? 0;
  const normalizedCurrency = currency.trim().toUpperCase() || 'EUR';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  }
}

function formatRating(value: unknown): string {
  const rating = toFiniteNumber(value);
  return rating === undefined ? 'No reviews' : rating.toFixed(1);
}

function formatReviewCount(value: unknown): string {
  return String(toNonNegativeInt(value));
}

function formatRelativeDate(value: string | null | undefined): string {
  if (!value) {
    return 'never';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return format(date, 'MMM d, yyyy');
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
