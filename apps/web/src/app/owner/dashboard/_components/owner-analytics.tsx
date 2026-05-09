import type { ReactNode } from 'react';
import {
  RiBarChart2Line,
  RiBookmarkLine,
  RiStarLine,
  RiStore2Line,
} from '@remixicon/react';
import { Badge, Card, CardContent } from 'ui-common';

import type {
  OwnerDashboardResponse,
  OwnerDashboardRestaurant,
} from '@/lib/restaurants';

export function OwnerAnalytics({
  summary,
  selectedRestaurant,
  restaurants,
}: {
  summary: OwnerDashboardResponse['summary'] | null;
  selectedRestaurant: OwnerDashboardRestaurant | null;
  restaurants: OwnerDashboardRestaurant[];
}) {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<RiStore2Line className="size-4" aria-hidden="true" />}
          label="Owned listings"
          value={String(summary?.restaurant_count ?? restaurants.length)}
        />
        <MetricCard
          icon={<RiStarLine className="size-4" aria-hidden="true" />}
          label="Average rating"
          value={formatRating(summary?.average_rating)}
        />
        <MetricCard
          icon={<RiBarChart2Line className="size-4" aria-hidden="true" />}
          label="Review count"
          value={String(summary?.review_count ?? 0)}
        />
        <MetricCard
          icon={<RiBookmarkLine className="size-4" aria-hidden="true" />}
          label="Total saves"
          value={String(summary?.favorite_count ?? 0)}
        />
        <MetricCard
          icon={<RiBarChart2Line className="size-4" aria-hidden="true" />}
          label="Save momentum"
          value={String(selectedRestaurant?.favorite_score ?? 0)}
        />
      </section>

      <Card className="border border-border/70 bg-card shadow-sm">
        <CardContent className="space-y-3">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm"
            >
              <span className="font-medium">{restaurant.name}</span>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">Rating {formatRating(restaurant.average_rating)}</Badge>
                <Badge variant="outline">Reviews {restaurant.review_count}</Badge>
                <Badge variant="outline">Saves {restaurant.favorite_count ?? 0}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border border-border/70 bg-card/90 shadow-sm backdrop-blur" size="sm">
      <CardContent className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <span>
          <span className="block text-[0.7rem] text-muted-foreground">{label}</span>
          <span className="text-lg font-semibold tracking-tight">{value}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function formatRating(value: unknown): string {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  return numeric === undefined || numeric === null ? 'No reviews' : numeric.toFixed(1);
}
