"use client";

import { Card, CardContent } from "ui-common";

import { type FavoriteRestaurant } from "@flavor-map/ui-module-restaurants";
import { RestaurantCard } from "./favorite-restaurant";
import { useFavoriteRestaurantMutation } from "@/app/restaurants/_hooks/use-favorite-restaurant-mutation";

type RestaurantGalleryProps = {
  restaurants: FavoriteRestaurant[];
  isLoading?: boolean;
};

export function RestaurantGallery({
  restaurants,
  isLoading,
}: RestaurantGalleryProps) {
  if (isLoading) {
    return <RestaurantGallerySkeleton />;
  }

  if (!restaurants.length) {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2 p-8 text-center">
          <h3 className="font-semibold">No favorite restaurants yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Restaurants you save will appear here for quick access and better
            recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant, index) => (
        <RestaurantGalleryCard key={restaurant.id ?? restaurant.slug ?? restaurant.name ?? index} restaurant={restaurant} />
      ))}
    </div>
  );
}

export function FavoriteRestaurantGallery(props: RestaurantGalleryProps) {
  return <RestaurantGallery {...props} />;
}

function RestaurantGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden rounded-xl">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <CardContent className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RestaurantGalleryCard({
  restaurant,
}: {
  restaurant: FavoriteRestaurant;
}) {
  const { isSaving, setFavorite } = useFavoriteRestaurantMutation({
    slug: restaurant.slug,
    is_favorite: restaurant.is_favorite,
    favorite_count: restaurant.favorite_count,
    favorite_score: restaurant.favorite_score,
    last_favorited_at: restaurant.last_favorited_at ?? null,
  });

  return (
    <RestaurantCard
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        imageUrl: restaurant.primary_photo_url,
        href: restaurant.slug ? `/restaurants/${restaurant.slug}` : null,
        cuisine: restaurant.categories?.[0]?.name,
        location: [restaurant.district, restaurant.city].filter(Boolean).join(", "),
        rating: restaurant.average_rating
          ? Number(restaurant.average_rating)
          : null,
        reviewCount: restaurant.review_count,
      }}
      onRemove={() => setFavorite(false)}
      isRemoving={isSaving}
    />
  );
}
