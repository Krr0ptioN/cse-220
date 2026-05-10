'use client';

import { AspectRatio, Badge, Card, CardContent } from 'ui-common';
import {
  RiMapPinLine,
  RiRouteLine,
  RiStarFill,
  RiTimeLine,
} from '@remixicon/react';

import {
  getRestaurantDistanceKm,
  getRestaurantImageUrl,
  getRestaurantStatus,
  type Restaurant,
} from '@/lib/restaurants';

type RestaurantHoverPreviewProps = {
  restaurant: Restaurant;
};

export function RestaurantHoverPreview({
  restaurant,
}: RestaurantHoverPreviewProps) {
  const imageUrl = getRestaurantImageUrl(restaurant);
  const distanceKm = getRestaurantDistanceKm(restaurant);
  const status = getRestaurantStatus(restaurant.opening_hours);
  const categoryName =
    restaurant.category?.name ?? restaurant.categories?.[0]?.name ?? 'Restaurant';

  return (
    <Card className="w-[320px] overflow-hidden border-border/70 bg-card/98 shadow-2xl shadow-black/20">
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <img
            src={imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
        </AspectRatio>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge className="border-white/20 bg-white/90 text-foreground shadow-sm">
            {categoryName}
          </Badge>
          {restaurant.price_range ? (
            <Badge
              variant="secondary"
              className="border-white/20 bg-white/90 text-foreground shadow-sm"
            >
              {restaurant.price_range}
            </Badge>
          ) : null}
        </div>
        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
          <RiStarFill className="size-3.5 text-amber-500" />
          {restaurant.average_rating?.toFixed(1) ?? 'N/A'}
          <span className="text-muted-foreground">
            ({restaurant.review_count ?? 0})
          </span>
        </div>
      </div>

      <CardContent className="space-y-3 p-3.5">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
            {restaurant.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {restaurant.description?.trim() ||
              'Popular neighborhood spot with standout dishes and friendly service.'}
          </p>
        </div>

        <div className="grid gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <RiMapPinLine className="size-3.5 shrink-0" />
            <span className="truncate">
              {[restaurant.city, restaurant.district, restaurant.address_line1]
                .filter(Boolean)
                .join(' • ') || 'Location available on the map'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <RiRouteLine className="size-3.5 shrink-0" />
            <span>{distanceKm.toFixed(1)} km away</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RiTimeLine className="size-3.5 shrink-0" />
            <span
              className={
                status.state === 'open' || status.state === 'closing-soon'
                  ? 'text-emerald-600'
                  : ''
              }
            >
              {status.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
