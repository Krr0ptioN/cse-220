'use client';

import Link from 'next/link';
import { RiHeartFill, RiHeartLine } from '@remixicon/react';
import { Button } from 'ui-common';
import { useFavoriteRestaurantMutation } from '../_hooks/use-favorite-restaurant-mutation';

export function RestaurantFavoriteButton({
  restaurantSlug,
  initialIsFavorite = false,
  initialFavoriteCount = 0,
}: {
  restaurantSlug: string;
  initialIsFavorite?: boolean;
  initialFavoriteCount?: number;
}) {
  const {
    isLoading,
    canFavorite,
    isSaving,
    isLocked,
    isFavorite,
    favoriteCount,
    setFavorite,
  } = useFavoriteRestaurantMutation({
    slug: restaurantSlug,
    is_favorite: initialIsFavorite,
    favorite_count: initialFavoriteCount,
  });

  if (!isLoading && !canFavorite) {
    return (
      <Button
        asChild
        variant="outline"
        className="inline-flex items-center gap-2"
      >
        <Link href="/auth/sign-in">
          <RiHeartLine className="size-4" aria-hidden="true" />
          Sign in to favorite
          <span className="text-muted-foreground">({favoriteCount})</span>
        </Link>
      </Button>
    );
  }

  return (
      <Button
      type="button"
      variant={isFavorite ? 'secondary' : 'outline'}
      onClick={() => setFavorite(!isFavorite)}
      disabled={isLoading || isSaving || isLocked}
      className="inline-flex items-center gap-2"
    >
      {isFavorite ? (
        <RiHeartFill className="size-4" aria-hidden="true" />
      ) : (
        <RiHeartLine className="size-4" aria-hidden="true" />
      )}
      Favorite
      <span className="text-muted-foreground">({favoriteCount})</span>
    </Button>
  );
}
