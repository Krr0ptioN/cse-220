'use client';

import { Badge } from 'ui-common';
import {
  RiMapPinLine,
  RiRouteLine,
  RiStarFill,
} from '@remixicon/react';
import {
  getRestaurantImageUrl,
  getRestaurantPhotoUrls,
  getRestaurantDistanceKm,
  type Restaurant,
} from '@/lib/restaurants';
import { RestaurantHours } from './restaurant-hours';
import { RestaurantPhotoCarousel } from './restaurant-photo-carousel';

interface RestaurantListItemProps {
  restaurant: Restaurant;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
}

export function RestaurantListItem({
  restaurant,
  isHovered,
  onHover,
  onLeave,
  onSelect,
}: RestaurantListItemProps) {
  const imageUrl = getRestaurantImageUrl(restaurant);
  const photoUrls = getRestaurantPhotoUrls(restaurant);
  const distanceKm = getRestaurantDistanceKm(restaurant.slug);
  const categoryName =
    restaurant.category?.name ?? restaurant.categories?.[0]?.name ?? 'Restaurant';

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className={`group block w-full overflow-hidden rounded-xl border text-left transition-all duration-200 ${
        isHovered
          ? 'border-primary/50 bg-card shadow-md ring-1 ring-primary/10'
          : 'border-border/60 bg-card/80 hover:border-border hover:shadow-sm'
      }`}
    >
      <div className="flex">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden">
          <RestaurantPhotoCarousel
            images={photoUrls.length ? photoUrls : [imageUrl]}
            alt={restaurant.name}
            showLightbox={false}
            imageClassName="transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30" />
        </div>

        <div className="flex flex-1 flex-col justify-between p-3">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
                {restaurant.name}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                <RiStarFill className="size-3 text-amber-500" />
                {restaurant.average_rating?.toFixed(1) ?? 'N/A'}
              </span>
            </div>

            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {restaurant.description?.trim() || 'Neighborhood favorite.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <RiMapPinLine className="size-3" />
              {restaurant.city || 'Unknown'}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <RiRouteLine className="size-3" />
              {distanceKm.toFixed(1)} km
            </span>
            <div className="basis-full">
              <RestaurantHours openingHours={restaurant.opening_hours} compact />
            </div>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {categoryName}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {restaurant.favorite_count ?? 0} saves
            </span>
            {restaurant.price_range && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                {restaurant.price_range}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
