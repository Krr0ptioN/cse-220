'use client';

import { useMemo, type ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  RiBarChart2Line,
  RiBookmarkLine,
  RiStore2Line,
  RiStarLine,
} from '@remixicon/react';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  NativeSelect,
  NativeSelectOption,
} from 'ui-common';

import type { OwnerDashboardResponse } from '@/lib/restaurants';
import { formatOwnerRating, useOwnerDashboard } from './owner-dashboard-context';

export function OwnerAnalyticsPart() {
  const { dashboard, restaurants, selectedRestaurant, selectedRestaurantSlug, setSelectedRestaurantSlug } =
    useOwnerDashboard();

  const summary = dashboard?.summary ?? null;
  const globalReviewers = dashboard?.reviewers ?? [];
  const selectedRestaurantReviewers = selectedRestaurant?.reviewer_stats ?? [];
  const selectedRestaurantSeries = useMemo(() => {
    const series = selectedRestaurant?.rating_progress ?? [];
    return series.map((point) => ({
      month: point.month,
      monthLabel: format(parseISO(point.month), 'MMM yyyy'),
      monthlyAverage: point.average_rating,
      cumulativeAverage: point.cumulative_average_rating,
      reviewCount: point.review_count,
      cumulativeReviewCount: point.cumulative_review_count,
    }));
  }, [selectedRestaurant]);
  const selectedRestaurantIndex = selectedRestaurant
    ? restaurants.findIndex((restaurant) => restaurant.slug === selectedRestaurant.slug) + 1
    : 0;
  const latestSeriesPoint = selectedRestaurantSeries[selectedRestaurantSeries.length - 1] ?? null;

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
          value={formatOwnerRating(summary?.average_rating)}
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.76fr)]">
        <Card className="border border-border/70 bg-card shadow-sm">
          <CardHeader className="space-y-2 border-b border-border/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <RiBarChart2Line className="size-4 text-muted-foreground" aria-hidden="true" />
                  Average rating progress
                </CardTitle>
                <CardDescription>
                  Track monthly and cumulative rating movement for one restaurant.
                </CardDescription>
              </div>
              <Badge variant="secondary">{selectedRestaurant?.review_count ?? 0} reviews</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-2">
                <label htmlFor="focus-restaurant" className="text-xs font-medium">
                  Focus restaurant
                </label>
                <NativeSelect
                  id="focus-restaurant"
                  value={selectedRestaurantSlug ?? ''}
                  onChange={(event) => setSelectedRestaurantSlug(event.target.value)}
                  className="w-full"
                >
                  {restaurants.map((restaurant) => (
                    <NativeSelectOption key={restaurant.slug} value={restaurant.slug}>
                      {restaurant.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Avg {formatOwnerRating(selectedRestaurant?.average_rating)}</Badge>
                <Badge variant="outline">Rank #{selectedRestaurantIndex || '—'}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            {selectedRestaurantSeries.length ? (
              <>
                <ChartContainer
                  config={{
                    monthlyAverage: {
                      label: 'Monthly average',
                      color: 'hsl(214 95% 55%)',
                    },
                    cumulativeAverage: {
                      label: 'Cumulative average',
                      color: 'hsl(160 84% 39%)',
                    },
                  }}
                  className="h-[320px] w-full"
                >
                  <LineChart
                    data={selectedRestaurantSeries}
                    margin={{ left: 8, right: 8, top: 12, bottom: 4 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="monthLabel"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={24}
                    />
                    <YAxis
                      domain={[0, 5]}
                      tickCount={6}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <Line
                      type="monotone"
                      dataKey="monthlyAverage"
                      stroke="var(--color-monthlyAverage)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeAverage"
                      stroke="var(--color-cumulativeAverage)"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
                <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Latest month</p>
                    <p className="text-sm font-semibold">{latestSeriesPoint?.monthLabel ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly reviews</p>
                    <p className="text-sm font-semibold">
                      {String(latestSeriesPoint?.reviewCount ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cumulative average</p>
                    <p className="text-sm font-semibold">
                      {latestSeriesPoint?.cumulativeAverage?.toFixed(1) ?? 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No rating history yet for this restaurant. Add reviews to start the trend line.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-sm">
          <CardHeader className="border-b border-border/70">
            <CardTitle>Reviewer activity</CardTitle>
            <CardDescription>
              Global reviewer leaderboard and selected-restaurant participation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Global reviewers
                </p>
                <Badge variant="secondary">{globalReviewers.length} reviewers</Badge>
              </div>
              {globalReviewers.length ? (
                <div className="space-y-2">
                  {globalReviewers.slice(0, 4).map((reviewer) => (
                    <ReviewerStatRow key={reviewer.id} reviewer={reviewer} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  No reviewer data yet.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected restaurant reviewers
                </p>
                <Badge variant="secondary">{selectedRestaurantReviewers.length} reviewers</Badge>
              </div>
              {selectedRestaurantReviewers.length ? (
                <div className="space-y-2">
                  {selectedRestaurantReviewers.slice(0, 4).map((reviewer) => (
                    <ReviewerStatRow key={reviewer.id} reviewer={reviewer} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  This restaurant has not built a reviewer profile yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
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

function ReviewerStatRow({ reviewer }: { reviewer: OwnerDashboardResponse['reviewers'][number] }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{reviewer.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {reviewer.review_count} reviews • {reviewer.restaurant_count} restaurants
          </p>
        </div>
        <Badge variant="secondary">{formatOwnerRating(reviewer.average_rating)}</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Last active {formatRelativeDate(reviewer.last_review_at)}</p>
    </div>
  );
}

function formatRelativeDate(value: string | null | undefined): string {
  if (!value) {
    return 'never';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return format(date, 'MMM d, yyyy');
}
