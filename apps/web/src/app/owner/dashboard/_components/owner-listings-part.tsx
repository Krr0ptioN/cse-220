'use client';

import {
  RiAddCircleLine,
  RiImageLine,
  RiPencilLine,
  RiStore2Line,
  RiUser3Line,
} from '@remixicon/react';
import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from 'ui-common';

import { RestaurantPhotoCarousel } from '@/app/restaurants/_components/restaurant-photo-carousel';
import {
  formatOwnerRating,
  formatOwnerReviewCount,
  useOwnerDashboard,
} from './owner-dashboard-context';
import { OwnerListingManagementTabs } from './owner-listing-management-tabs';

export function OwnerListingsPart() {
  const dashboard = useOwnerDashboard();
  const {
    selectedRestaurant,
    selectedRestaurantPreviewUrl,
    selectedRestaurantPhotoUrls,
    formValues,
    summary,
    user,
    restaurants,
    resetForm,
    editRestaurant,
  } = dashboard;

  return (
    <>
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
                  <RestaurantPhotoCarousel
                    images={
                      selectedRestaurantPhotoUrls.length
                        ? selectedRestaurantPhotoUrls
                        : [selectedRestaurantPreviewUrl]
                    }
                    alt={selectedRestaurant?.name || 'Restaurant preview'}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,oklch(0.98_0.01_90),oklch(0.94_0.02_86))] text-muted-foreground">
                    <RiImageLine className="size-12" aria-hidden="true" />
                  </div>
                )}
              </AspectRatio>
            </div>
            <DetailRow label="Restaurant name" value={selectedRestaurant?.name || 'Not created yet'} />
            <DetailRow label="Category" value={selectedRestaurant?.category?.name || 'Select category'} />
            <DetailRow label="City" value={selectedRestaurant?.city || formValues.city || 'Istanbul'} />
            <DetailRow label="District" value={selectedRestaurant?.district || formValues.district || 'Not set'} />
            <DetailRow
              label="Photo"
              value={
                formValues.primaryPhotoFile?.name ||
                (selectedRestaurant?.photos?.length
                  ? `${selectedRestaurant.photos.length} gallery photo${
                      selectedRestaurant.photos.length === 1 ? '' : 's'
                    }`
                  : selectedRestaurant?.primary_photo_url
                    ? 'Current primary photo'
                    : 'Upload a photo')
              }
            />
            {selectedRestaurant?.photos?.length ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Gallery preview</p>
                <p className="text-xs text-muted-foreground">
                  Photo editing now lives in the gallery tab.
                </p>
              </div>
            ) : null}
          </div>
          <div className="space-y-4 px-5 py-4">
            <DetailRow label="Rating" value={formatOwnerRating(summary?.average_rating)} />
            <DetailRow label="Reviews" value={String(summary?.review_count ?? 0)} />
            <DetailRow label="Owned listings" value={String(summary?.restaurant_count ?? restaurants.length)} />
          </div>
          <div className="space-y-4 px-5 py-4">
            <DetailRow label="Phone" value={selectedRestaurant?.phone || formValues.phone || 'Add phone'} />
            <DetailRow label="Website" value={selectedRestaurant?.website || formValues.website || 'Add website'} />
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

      <OwnerListingManagementTabs />

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
                    <h2 className="truncate text-sm font-medium">{restaurant.name}</h2>
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
                  <span>Rating: {formatOwnerRating(restaurant.average_rating)}</span>
                  <span>Reviews: {formatOwnerReviewCount(restaurant.review_count)}</span>
                  <span>Saves: {restaurant.favorite_count ?? 0}</span>
                  <span>Momentum: {restaurant.favorite_score ?? 0}</span>
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </>
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
