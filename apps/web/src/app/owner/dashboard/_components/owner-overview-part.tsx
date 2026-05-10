'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  RiArrowRightLine,
  RiBarChart2Line,
  RiBookmarkLine,
  RiCalendarLine,
  RiChat3Line,
  RiFileList3Line,
  RiPhoneLine,
  RiStarLine,
  RiStore2Line,
} from '@remixicon/react';
import { Badge, Button, Card, CardContent } from 'ui-common';

import {
  formatOwnerRating,
  useOwnerDashboard,
} from './owner-dashboard-context';

export function OwnerOverviewPart() {
  const { selectedRestaurant, summary, restaurants, user } = useOwnerDashboard();

  return (
    <>
      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15 sm:size-24">
            <RiStore2Line className="size-10" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {selectedRestaurant?.name || user?.display_name || 'Restaurant profile'}
              </h1>
              <Badge variant="secondary">Owner dashboard</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-medium text-muted-foreground">
              <ProfileAction icon={<RiChat3Line className="size-4" />} label="Start a conversation" />
              <ProfileAction icon={<RiCalendarLine className="size-4" />} label="Schedule reminder" />
              <ProfileAction icon={<RiFileList3Line className="size-4" />} label="Add a note" />
              <ProfileAction icon={<RiPhoneLine className="size-4" />} label="Call restaurant" />
            </div>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/restaurants" className="inline-flex items-center gap-1">
            View public listings
            <RiArrowRightLine className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>

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
    </>
  );
}

function ProfileAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      {icon}
      {label}
    </span>
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
