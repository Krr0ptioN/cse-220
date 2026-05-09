'use client';

import { useEffect, useState } from 'react';
import { Drawer, DrawerContent } from 'ui-common';

import type { Restaurant } from '@/lib/restaurants';
import { RestaurantInfoPanel } from './restaurant-info-panel';

type SelectedRestaurantReviewsProps = {
  restaurant: Restaurant | null;
  onClose: () => void;
};

export function SelectedRestaurantReviews({
  restaurant,
  onClose,
}: SelectedRestaurantReviewsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateViewport = () => setIsMobile(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  return (
    <>
      <aside className="hidden w-[420px] shrink-0 overflow-y-auto border-l border-border/60 bg-background lg:block">
        {restaurant ? (
          <RestaurantInfoPanel restaurant={restaurant} onClose={onClose} />
        ) : (
          <EmptySelection />
        )}
      </aside>

      {isMobile && (
        <Drawer open={Boolean(restaurant)} onOpenChange={(open) => !open && onClose()}>
          <DrawerContent>
            {restaurant && (
              <div className="max-h-[78vh] overflow-y-auto px-2 pb-4">
                <RestaurantInfoPanel restaurant={restaurant} onClose={onClose} />
              </div>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

function EmptySelection() {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium">Select a restaurant</p>
        <p className="text-xs text-muted-foreground">
          Choose a marker or result to read diner reviews and join the
          conversation.
        </p>
      </div>
    </div>
  );
}
