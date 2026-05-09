import Link from 'next/link';
import { headers } from 'next/headers';
import { AspectRatio, Badge, Card, CardContent, CardHeader } from 'ui-common';
import {
  RiArrowLeftLine,
  RiExternalLinkLine,
  RiMapPinLine,
  RiPhoneLine,
  RiStarFill,
  RiTimeLine,
  RiGlobalLine,
} from '@remixicon/react';

import {
  fetchRestaurantDetail,
  fetchRestaurantMenuItems,
  getRestaurantCoverImage,
  getRestaurantImageUrl,
  getRestaurantPhotoUrls,
  getRestaurantDistanceKm,
  getRestaurantStatus,
  slugToTitle,
} from '@/lib/restaurants';
import { fetchRestaurantReviews } from '@/lib/reviews';
import { RestaurantFavoriteButton } from '../_components/restaurant-favorite-button';
import { RestaurantHours } from '../_components/restaurant-hours';
import { RestaurantMenuPreview } from '../_components/restaurant-menu-preview';
import { RestaurantPhotoCarousel } from '../_components/restaurant-photo-carousel';
import { ReviewSection } from '../_components/review-section';

type RestaurantDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RestaurantDetailPage({
  params,
}: RestaurantDetailPageProps) {
  const { slug } = await params;
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie');
  const [restaurant, reviewsResponse, menuItems] = await Promise.all([
    fetchRestaurantDetail(slug, cookieHeader),
    fetchRestaurantReviews(slug),
    fetchRestaurantMenuItems(slug),
  ]);

  const displayName = restaurant?.name || slugToTitle(slug);
  const imageUrl = restaurant ? getRestaurantImageUrl(restaurant) : getRestaurantCoverImage(slug);
  const photoUrls = restaurant ? getRestaurantPhotoUrls(restaurant) : [imageUrl];
  const distanceKm = getRestaurantDistanceKm(slug);
  const status = restaurant ? getRestaurantStatus(restaurant.opening_hours) : null;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative">
        <AspectRatio ratio={21 / 9} className="overflow-hidden">
          <RestaurantPhotoCarousel
            images={photoUrls.length ? photoUrls : [imageUrl]}
            alt={displayName}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </AspectRatio>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 sm:px-6 sm:pb-8">
          <Link
            href="/restaurants"
            className="mb-3 inline-flex items-center gap-1 text-xs text-white/80 hover:text-white"
          >
            <RiArrowLeftLine className="size-4" />
            Back to listings
          </Link>

          <div className="flex flex-wrap items-end gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {displayName}
            </h1>
            <Badge
              variant="secondary"
              className={`shrink-0 text-xs ${
                status?.state === 'open' || status?.state === 'closing-soon'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-white/20 text-white/80'
              }`}
            >
              <RiTimeLine className="mr-1 size-3" />
              {status?.label ?? 'Hours unavailable'}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/90">
            <span className="inline-flex items-center gap-1">
              <RiStarFill className="size-4 text-amber-400" />
              <span className="font-semibold">
                {restaurant?.average_rating?.toFixed(1) ?? 'N/A'}
              </span>
              <span className="text-white/60">
                ({restaurant?.review_count ?? 0} reviews)
              </span>
            </span>
            {restaurant?.category?.name && (
              <span className="text-white/70">
                - {restaurant.category.name}
              </span>
            )}
            <span className="text-white/60">
              - {distanceKm.toFixed(1)} km away
            </span>
          </div>
          {restaurant && (
            <div className="mt-4">
              <RestaurantFavoriteButton
                restaurantSlug={restaurant.slug}
                initialIsFavorite={Boolean(restaurant.is_favorite)}
                initialFavoriteCount={restaurant.favorite_count ?? 0}
              />
            </div>
          )}
        </div>
      </section>

      {/* Info cards */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Details */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <h2 className="text-lg font-semibold">About</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {restaurant?.description ||
                  'No description available for this restaurant.'}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {restaurant?.opening_hours && (
                  <div className="sm:col-span-2">
                    <RestaurantHours openingHours={restaurant.opening_hours} />
                  </div>
                )}
                {restaurant?.address_line1 && (
                  <div className="flex items-start gap-2 text-sm">
                    <RiMapPinLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {restaurant.address_line1}
                      {restaurant.city ? `, ${restaurant.city}` : ''}
                      {restaurant.district ? ` • ${restaurant.district}` : ''}
                    </span>
                  </div>
                )}
                {restaurant?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <RiPhoneLine className="size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="text-primary hover:underline"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant?.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <RiGlobalLine className="size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Visit website
                      <RiExternalLinkLine className="size-3" />
                    </a>
                  </div>
                )}
                {restaurant?.price_range && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Price range:{' '}
                      <span className="font-medium text-foreground">
                        {'€'.repeat(Number(restaurant.price_range))}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-lg font-semibold">Quick info</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">
                  {restaurant?.category?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <RiStarFill className="size-3.5 text-amber-500" />
                  {restaurant?.average_rating?.toFixed(1) ?? 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">
                  {restaurant?.review_count ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">
                  {restaurant?.price_range
                    ? '€'.repeat(Number(restaurant.price_range))
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">{distanceKm.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`font-medium ${
                    status?.state === 'open' || status?.state === 'closing-soon'
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {status?.label ?? 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorites</span>
                <span className="font-medium">{restaurant?.favorite_count ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Menu */}
      <section className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Menu</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current dishes and specials shared by the restaurant.
              </p>
            </div>
            <Badge variant="secondary">{menuItems.length} items</Badge>
          </CardHeader>
          <CardContent className="pt-5">
            <RestaurantMenuPreview menuItems={menuItems} />
          </CardContent>
        </Card>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <ReviewSection
          restaurantSlug={slug}
          restaurantName={displayName}
          initialReviews={reviewsResponse.data}
          totalReviews={reviewsResponse.pagination.total}
        />
      </section>
    </main>
  );
}
