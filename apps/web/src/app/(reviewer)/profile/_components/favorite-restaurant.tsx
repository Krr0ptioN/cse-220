"use client";

import Link from "next/link";
import { Card, CardContent, cn, Button } from "ui-common";

export type RestaurantCardData = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  href?: string | null;
  cuisine?: string | null;
  location?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
};

interface RestaurantCardProps {
  restaurant: RestaurantCardData;
  className?: string;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export function RestaurantCard({
  restaurant,
  className,
  onRemove,
  isRemoving,
}: RestaurantCardProps) {
  const displayName = restaurant.name?.trim() || "Favorite restaurant";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <Card
      className={cn(
        "group h-full overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {restaurant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.imageUrl}
            alt={displayName}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-background text-sm font-semibold">
              {initials}
            </div>
          </div>
        )}

        {restaurant.rating ? (
          <div className="absolute right-3 top-3 rounded-full border bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur">
            ★ {restaurant.rating.toFixed(1)}
          </div>
        ) : null}
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-semibold tracking-tight">
              {displayName}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {restaurant.cuisine ? <span>{restaurant.cuisine}</span> : null}
            {restaurant.cuisine && restaurant.location ? <span>•</span> : null}
            {restaurant.location ? <span>{restaurant.location}</span> : null}
          </div>
        </div>

        {restaurant.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {restaurant.description}
          </p>
        ) : (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            View details, reviews, and recommendations for this restaurant.
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {restaurant.reviewCount
              ? `${restaurant.reviewCount} reviews`
              : "Favorite restaurant"}
          </span>

          {onRemove ? (
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-xs"
              disabled={isRemoving}
              onClick={(event) => {
                event.preventDefault();
                onRemove();
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (!restaurant.href) {
    return content;
  }

  return (
    <Link href={restaurant.href} className="block h-full">
      {content}
    </Link>
  );
}
