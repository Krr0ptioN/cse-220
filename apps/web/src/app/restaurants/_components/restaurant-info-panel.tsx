'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  RiCloseLine,
  RiDirectionLine,
  RiGlobalLine,
  RiMapPinLine,
  RiHeartFill,
  RiHeartLine,
  RiPhoneLine,
  RiShareForwardLine,
  RiStarFill,
} from '@remixicon/react';
import {
  AspectRatio,
  Badge,
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'ui-common';
import {
  fetchRestaurantMenuItems,
  getRestaurantImageUrl,
  getRestaurantPhotoUrls,
  type MenuItem,
  type Restaurant,
} from '@/lib/restaurants';
import { fetchRestaurantReviews, type Review } from '@/lib/reviews';
import { useFavoriteRestaurantMutation } from '../_hooks/use-favorite-restaurant-mutation';
import { RestaurantHours } from './restaurant-hours';
import { RestaurantMenuPreview } from './restaurant-menu-preview';
import { RestaurantPhotoCarousel } from './restaurant-photo-carousel';
import { ReviewSection } from './review-section';

export function RestaurantInfoPanel({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(restaurant.review_count ?? 0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    isLoading: isFavoriteAccessLoading,
    canFavorite,
    isLocked,
    isSaving: isSavingFavorite,
    isFavorite,
    favoriteCount,
    toggleFavorite,
  } = useFavoriteRestaurantMutation(restaurant);
  const imageUrl = getRestaurantImageUrl(restaurant);
  const photoUrls = getRestaurantPhotoUrls(restaurant);
  const categoryName =
    restaurant.category?.name ?? restaurant.categories?.[0]?.name ?? 'Restaurant';

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);

    async function loadPanelData() {
      const [reviewsResponse, menuResponse] = await Promise.all([
        fetchRestaurantReviews(restaurant.slug, 1, 10),
        fetchRestaurantMenuItems(restaurant.slug),
      ]);

      if (ignore) return;

      setReviews(reviewsResponse.data);
      setReviewTotal(reviewsResponse.pagination.total);
      setMenuItems(menuResponse);
      setIsLoading(false);
    }

    void loadPanelData().catch(() => {
      if (!ignore) {
        setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [restaurant]);

  return (
    <div className="min-h-full bg-background">
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <RestaurantPhotoCarousel
            images={photoUrls.length ? photoUrls : [imageUrl]}
            alt={restaurant.name}
          />
        </AspectRatio>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute right-3 top-3 rounded-full"
          onClick={onClose}
          aria-label="Close restaurant details"
        >
          <RiCloseLine className="size-5" aria-hidden="true" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{restaurant.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <RiStarFill className="size-4 text-amber-500" aria-hidden="true" />
            <span className="font-medium text-foreground">
              {restaurant.average_rating?.toFixed(1) ?? 'N/A'}
            </span>
            <span>({reviewTotal} reviews)</span>
            <span>{categoryName}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center text-xs font-medium text-primary">
          <PanelAction icon={<RiDirectionLine className="size-5" />} label="Directions" />
          {!isFavoriteAccessLoading && !canFavorite ? (
            <PanelAction
              icon={<RiHeartLine className="size-5" />}
              label="Sign in"
              href="/auth/sign-in"
            />
          ) : (
            <PanelAction
              icon={
                isFavorite ? (
                  <RiHeartFill className="size-5" />
                ) : (
                  <RiHeartLine className="size-5" />
                )
              }
              label="Favorite"
              onClick={toggleFavorite}
              disabled={isFavoriteAccessLoading || isSavingFavorite || isLocked}
            />
          )}
          <PanelAction icon={<RiShareForwardLine className="size-5" />} label="Share" />
          <PanelAction
            icon={<RiGlobalLine className="size-5" />}
            label="Website"
            href={restaurant.website}
          />
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <RestaurantHours openingHours={restaurant.opening_hours} />
            <InfoLine
              icon={<RiMapPinLine className="size-4" />}
              text={[restaurant.address_line1, restaurant.district, restaurant.city]
                .filter(Boolean)
                .join(', ')}
            />
            {restaurant.phone && (
              <InfoLine icon={<RiPhoneLine className="size-4" />} text={restaurant.phone} />
            )}
            <div className="flex flex-wrap gap-2">
              {(restaurant.categories ?? []).map((category) => (
                <Badge key={category.id ?? category.slug ?? category.name} variant="outline">
                  {category.name}
                </Badge>
              ))}
              <Badge variant="secondary">{favoriteCount} saves</Badge>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="pt-4">
            {isLoading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : (
              <RestaurantMenuPreview menuItems={menuItems} />
            )}
          </TabsContent>

          <TabsContent value="reviews" className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
            ) : (
              <ReviewSection
                key={restaurant.slug}
                restaurantSlug={restaurant.slug}
                restaurantName={restaurant.name}
                initialReviews={reviews}
                totalReviews={reviewTotal}
              />
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-3 pt-4 text-sm text-muted-foreground">
            <p>{restaurant.description || 'No description available.'}</p>
            <RestaurantHours openingHours={restaurant.opening_hours} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PanelAction({
  icon,
  label,
  href,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="space-y-1">
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="space-y-1 disabled:opacity-60"
    >
      {content}
    </button>
  );
}

function InfoLine({ icon, text }: { icon: ReactNode; text: string }) {
  if (!text) return null;

  return (
    <p className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-primary">{icon}</span>
      <span>{text}</span>
    </p>
  );
}
