'use client';

import { RiTimeLine } from '@remixicon/react';
import { Badge } from 'ui-common';

import {
  getRestaurantStatus,
  type RestaurantOpeningHour,
} from '@/lib/restaurants';

export function RestaurantHours({
  openingHours,
  compact = false,
}: {
  openingHours?: RestaurantOpeningHour[];
  compact?: boolean;
}) {
  const status = getRestaurantStatus(openingHours);
  const tone =
    status.state === 'open'
      ? 'text-emerald-600'
      : status.state === 'closing-soon'
        ? 'text-amber-600'
        : 'text-muted-foreground';

  return (
    <div className="space-y-2 text-sm">
      <div className={`flex items-center gap-2 font-medium ${tone}`}>
        <RiTimeLine className="size-4 shrink-0" aria-hidden="true" />
        <span>{status.label}</span>
        <span className="text-muted-foreground">- {status.detail}</span>
      </div>

      {status.state === 'closing-soon' && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Closing soon. Check the latest timing before heading there.
        </p>
      )}

      {!compact && openingHours?.length ? (
        <div className="divide-y divide-border/70 rounded-lg border border-border/70">
          {openingHours.map((hour) => (
            <div
              key={hour.id ?? hour.day_of_week}
              className="flex justify-between gap-3 px-3 py-2"
            >
              <span>
                {hour.day_display ?? hour.display_day ?? `Day ${hour.day_of_week}`}
              </span>
              <span className="text-muted-foreground">
                {hour.is_closed
                  ? 'Closed'
                  : `${hour.open_time?.slice(0, 5) ?? '--:--'} - ${
                      hour.close_time?.slice(0, 5) ?? '--:--'
                    }`}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {compact && status.state !== 'unknown' ? (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
          {status.detail}
        </Badge>
      ) : null}
    </div>
  );
}
