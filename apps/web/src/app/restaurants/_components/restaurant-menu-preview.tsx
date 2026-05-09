import { RiRestaurant2Line } from '@remixicon/react';
import { AspectRatio, Badge } from 'ui-common';

import type { MenuItem } from '@/lib/restaurants';

export function RestaurantMenuPreview({ menuItems }: { menuItems: MenuItem[] }) {
  const groups = groupMenuItemsByCategory(menuItems);

  if (!groups.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        This restaurant has not published menu items yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <Badge variant="secondary">{group.items.length} items</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((item) => (
              <article
                key={item.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-lg border border-border/70 p-3"
              >
                <div className="overflow-hidden rounded-md bg-muted">
                  <AspectRatio ratio={1}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <RiRestaurant2Line className="size-6" aria-hidden="true" />
                      </div>
                    )}
                  </AspectRatio>
                </div>
                <div className="min-w-0">
                  <div className="flex justify-between gap-2">
                    <h4 className="truncate text-sm font-medium">{item.name}</h4>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatPrice(item)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.description || 'No description yet.'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupMenuItemsByCategory(menuItems: MenuItem[]) {
  const groups = new Map<
    string,
    { key: string; label: string; items: MenuItem[] }
  >();

  for (const item of menuItems) {
    const key = item.category?.id ?? item.category?.name ?? 'uncategorized';
    const label = item.category?.name ?? 'Uncategorized';
    const group = groups.get(key) ?? { key, label, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }

  return [...groups.values()];
}

function formatPrice(item: MenuItem): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: item.currency || 'EUR',
    }).format(item.price);
  } catch {
    return `${item.price.toFixed(2)} ${item.currency || 'EUR'}`;
  }
}
