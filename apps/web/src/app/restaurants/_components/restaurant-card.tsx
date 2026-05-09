'use client';

import Link from 'next/link';
import React from 'react';
import { AspectRatio, Badge, Card, CardContent, Button } from 'ui-common';
import {
  RiMapPinLine,
  RiRouteLine,
  RiStarFill,
  RiHeartFill,
  RiHeartLine,
  RiTimeLine,
} from '@remixicon/react';

import {
  getRestaurantImageUrl,
  getRestaurantPhotoUrls,
  getRestaurantDistanceKm,
  getRestaurantIsOpen,
  type Restaurant,
} from '@/lib/restaurants';
import { useFavoriteRestaurantMutation } from '../_hooks/use-favorite-restaurant-mutation';
import { RestaurantPhotoCarousel } from './restaurant-photo-carousel';

type RestaurantCardProps = {
  restaurant: Restaurant;
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const imageUrl = getRestaurantImageUrl(restaurant);
  const photoUrls = getRestaurantPhotoUrls(restaurant);
  const distanceKm = getRestaurantDistanceKm(restaurant.slug);
  const isOpen = getRestaurantIsOpen(restaurant.slug);
  const {
    isLoading,
    canFavorite,
    isSaving,
    isLocked,
    isFavorite,
    favoriteCount,
    toggleFavorite,
  } = useFavoriteRestaurantMutation(restaurant);

  return (
    <Card className="group overflow-hidden border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <RestaurantPhotoCarousel
            images={photoUrls.length ? photoUrls : [imageUrl]}
            alt={restaurant.name}
          />
        </AspectRatio>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        {!isLoading && !canFavorite ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="absolute right-3 top-3 h-auto rounded-full border-white/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-foreground/90 backdrop-blur hover:bg-white"
          >
            <Link href="/auth/sign-in">
              <RiHeartLine className="size-4" />
              <span>Sign in to favorite</span>
              <span className="text-muted-foreground">({favoriteCount})</span>
            </Link>
          </Button>
        ) : (
          <button
            type="button"
            aria-label={isFavorite ? 'Remove favorite' : 'Favorite restaurant'}
            disabled={isLoading || isSaving || isLocked}
            onClick={toggleFavorite}
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-foreground/90 backdrop-blur transition-colors hover:bg-white disabled:opacity-70"
          >
            {isFavorite ? (
              <RiHeartFill className="size-4 text-rose-600" />
            ) : (
              <RiHeartLine className="size-4" />
            )}
            <span>Favorite</span>
            <span className="text-muted-foreground">({favoriteCount})</span>
          </button>
        )}
        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-foreground">
          <RiStarFill className="size-3.5 text-amber-500" />
          {restaurant.average_rating?.toFixed(1) ?? '4.5'}
        </div>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-foreground">
            {restaurant.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {restaurant.description?.trim() ||
              'Popular neighborhood spot with standout dishes and friendly service.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <RiMapPinLine className="size-3.5" />
            {restaurant.city || 'Unknown'}
            {restaurant.district ? `, ${restaurant.district}` : ''}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <RiRouteLine className="size-3.5" />
            {distanceKm.toFixed(1)} km
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <RiTimeLine className="size-3.5" />
            {isOpen ? 'Open now' : 'Closed'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {restaurant.category?.name ? (
            <Badge variant="secondary">{restaurant.category.name}</Badge>
          ) : null}
          {restaurant.price_range ? (
            <Badge variant="outline">{restaurant.price_range}</Badge>
          ) : null}
          <Badge variant="outline">
            {restaurant.review_count ?? 0} reviews
          </Badge>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button asChild size="sm" className="h-8 rounded-full px-3 text-xs">
            <Link href={`/restaurants/${restaurant.slug}`}>View details</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
          >
            <Link href={`/restaurants/${restaurant.slug}#reviews`}>
              See reviews
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
