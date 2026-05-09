"use client";

import { cn } from "ui-common";

type VercelTab<TValue extends string> = {
  value: TValue;
  label: string;
  count?: number;
};

type TabsProps<TValue extends string> = {
  value: TValue;
  onValueChange: (value: TValue) => void;
  tabs: VercelTab<TValue>[];
};

export function VercelTabs<TValue extends string>({
  value,
  onValueChange,
  tabs,
}: TabsProps<TValue>) {
  return (
    <div className="border-b">
      <div role="tablist" className="flex items-center gap-6">
        {tabs.map((tab) => {
          const isActive = value === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "relative -mb-px flex h-10 items-center gap-2 border-b-2 border-transparent text-sm font-medium text-muted-foreground transition hover:text-foreground",
                isActive && "border-foreground text-foreground",
              )}
            >
              {tab.label}

              {typeof tab.count === "number" ? (
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground",
                    isActive && "text-foreground",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
