import { Input, Switch } from 'ui-common';

import type { OpeningHourFormValues } from '../_lib/owner-dashboard-utils';

export function OwnerHoursEditor({
  value,
  onChange,
  disabled,
}: {
  value: OpeningHourFormValues[];
  onChange: (value: OpeningHourFormValues[]) => void;
  disabled?: boolean;
}) {
  function update(index: number, patch: Partial<OpeningHourFormValues>) {
    onChange(
      value.map((hour, currentIndex) =>
        currentIndex === index ? { ...hour, ...patch } : hour,
      ),
    );
  }

  return (
    <div className="space-y-2">
      {value.map((hour, index) => (
        <div
          key={hour.dayOfWeek}
          className="grid gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[96px_1fr_1fr_auto] sm:items-center"
        >
          <span className="text-sm font-medium">{hour.dayDisplay}</span>
          <Input
            type="time"
            value={hour.openTime}
            onChange={(event) => update(index, { openTime: event.target.value })}
            disabled={disabled || hour.isClosed}
          />
          <Input
            type="time"
            value={hour.closeTime}
            onChange={(event) => update(index, { closeTime: event.target.value })}
            disabled={disabled || hour.isClosed}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={hour.isClosed}
              onCheckedChange={(checked) => update(index, { isClosed: checked })}
              disabled={disabled}
            />
            Closed
          </label>
        </div>
      ))}
    </div>
  );
}
