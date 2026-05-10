'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  NativeSelect,
  NativeSelectOption,
  Switch,
  Textarea,
  cn,
} from 'ui-common';
import {
  RiAddCircleLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiImageLine,
  RiPencilLine,
  RiRestaurant2Line,
} from '@remixicon/react';

import {
  API_ENDPOINTS,
  normalizeMenuItems,
  type MenuItem,
} from '@/lib/restaurants';
import { sessionRequest } from '@flavor-map/ui-module-auth';
import { useOwnerDashboard } from './owner-dashboard-context';

type MenuLoadState = 'idle' | 'loading' | 'ready' | 'error';

type MenuItemFormValues = {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  currency: string;
  sortOrder: string;
  isAvailable: boolean;
};

export function OwnerMenuPart() {
  const { selectedRestaurant, categories } = useOwnerDashboard();
  const defaultCategoryId = categories[0]?.id ?? '';
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadState, setLoadState] = useState<MenuLoadState>('idle');
  const [formValues, setFormValues] = useState<MenuItemFormValues>(() =>
    emptyMenuItemFormValues(defaultCategoryId),
  );
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!formValues.categoryId && defaultCategoryId) {
      setFormValues((current) => ({ ...current, categoryId: defaultCategoryId }));
    }
  }, [defaultCategoryId, formValues.categoryId]);

  useEffect(() => {
    setEditingMenuItemId(null);
    setMessage(null);
    setError(null);
    setFormValues(emptyMenuItemFormValues(defaultCategoryId));

    if (!selectedRestaurant) {
      setMenuItems([]);
      setLoadState('idle');
      return;
    }

    const restaurant = selectedRestaurant;
    let ignore = false;

    async function loadMenuItems() {
      setLoadState('loading');

      try {
        const payload = await sessionRequest<unknown>(
          API_ENDPOINTS.restaurants.menuItems(restaurant.slug),
        );
        if (!ignore) {
          setMenuItems(normalizeMenuItems(payload));
          setLoadState('ready');
        }
      } catch (caught) {
        if (!ignore) {
          setError(caught instanceof Error ? caught.message : 'Unable to load menu items.');
          setLoadState('error');
        }
      }
    }

    void loadMenuItems();
    return () => {
      ignore = true;
    };
  }, [defaultCategoryId, selectedRestaurant]);

  function updateMenuField<K extends keyof MenuItemFormValues>(
    field: K,
    value: MenuItemFormValues[K],
  ) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function editMenuItem(menuItem: MenuItem) {
    setEditingMenuItemId(menuItem.id);
    setFormValues(menuItemToFormValues(menuItem, defaultCategoryId));
    setMessage(null);
    setError(null);
  }

  function resetMenuForm() {
    setEditingMenuItemId(null);
    setFormValues(emptyMenuItemFormValues(defaultCategoryId));
    setMessage(null);
    setError(null);
  }

  async function submitMenuItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRestaurant) {
      setError('Select a restaurant before editing its menu.');
      return;
    }

    if (!formValues.categoryId) {
      setError('Select a category before saving this menu item.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const endpoint = editingMenuItemId
        ? API_ENDPOINTS.restaurants.menuItem(selectedRestaurant.slug, editingMenuItemId)
        : API_ENDPOINTS.restaurants.menuItems(selectedRestaurant.slug);
      const payload = await sessionRequest<unknown>(endpoint, {
        method: editingMenuItemId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildMenuItemPayload(formValues)),
      });
      const savedMenuItem = normalizeMenuItems([payload])[0];

      if (!savedMenuItem) {
        throw new Error('The menu item response was invalid.');
      }

      setMenuItems((current) =>
        sortMenuItems(
          editingMenuItemId
            ? current.map((item) => (item.id === editingMenuItemId ? savedMenuItem : item))
            : [savedMenuItem, ...current],
        ),
      );
      setEditingMenuItemId(null);
      setFormValues(emptyMenuItemFormValues(defaultCategoryId));
      setMessage(editingMenuItemId ? 'Menu item updated.' : 'Menu item added.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save menu item.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteMenuItem(menuItem: MenuItem) {
    if (!selectedRestaurant) return;

    const shouldDelete = window.confirm(`Delete "${menuItem.name}" from the menu?`);
    if (!shouldDelete) {
      return;
    }

    setDeletingMenuItemId(menuItem.id);
    setMessage(null);
    setError(null);

    try {
      await sessionRequest<void>(
        API_ENDPOINTS.restaurants.menuItem(selectedRestaurant.slug, menuItem.id),
        { method: 'DELETE' },
      );
      setMenuItems((current) => current.filter((item) => item.id !== menuItem.id));
      if (editingMenuItemId === menuItem.id) {
        resetMenuForm();
      }
      setMessage('Menu item deleted.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete menu item.');
    } finally {
      setDeletingMenuItemId(null);
    }
  }

  const availableItems = menuItems.filter((item) => item.is_available).length;
  const categoryCount = new Set(
    menuItems.map((item) => item.category?.id ?? item.category?.name).filter(Boolean),
  ).size;

  return (
    <Card className="border border-border/70 bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <RiRestaurant2Line className="size-4 text-muted-foreground" aria-hidden="true" />
            Menu management
          </CardTitle>
          <CardDescription>
            Create, update, and remove dishes for the selected restaurant.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{menuItems.length} items</Badge>
          <Badge variant="outline">{availableItems} available</Badge>
          <Badge variant="outline">{categoryCount} categories</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {!selectedRestaurant ? (
          <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
            Create or select a restaurant before managing menu items.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{selectedRestaurant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Public menu items appear on the restaurant detail page.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={resetMenuForm} disabled={submitting}>
                  <RiAddCircleLine className="size-3" aria-hidden="true" />
                  New item
                </Button>
              </div>

              {loadState === 'loading' ? (
                <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                  Loading menu items...
                </div>
              ) : loadState === 'error' ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive">
                  {error ?? 'Unable to load menu items.'}
                </div>
              ) : menuItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                  No menu items yet. Add the first dish, drink, or special for this listing.
                </div>
              ) : (
                <div className="space-y-3">
                  {menuItems.map((menuItem) => (
                    <article
                      key={menuItem.id}
                      className={cn(
                        'grid gap-3 rounded-xl border border-border/70 bg-background p-3 transition-colors sm:grid-cols-[72px_minmax(0,1fr)_auto]',
                        editingMenuItemId === menuItem.id && 'border-primary/40 bg-primary/5',
                      )}
                    >
                      <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
                        <AspectRatio ratio={1}>
                          {menuItem.image_url ? (
                            <img src={menuItem.image_url} alt={menuItem.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <RiImageLine className="size-7" aria-hidden="true" />
                            </div>
                          )}
                        </AspectRatio>
                      </div>

                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold">{menuItem.name}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {menuItem.description || 'No description yet.'}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold">
                            {formatMenuPrice(menuItem.price, menuItem.currency)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[11px]">
                            {menuItem.category?.name ?? 'Uncategorized'}
                          </Badge>
                          <Badge
                            variant={menuItem.is_available ? 'secondary' : 'outline'}
                            className="text-[11px]"
                          >
                            {menuItem.is_available ? (
                              <RiCheckboxCircleLine className="mr-1 size-3" aria-hidden="true" />
                            ) : (
                              <RiCloseCircleLine className="mr-1 size-3" aria-hidden="true" />
                            )}
                            {menuItem.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">
                            Sort {menuItem.sort_order}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 sm:flex-col">
                        <Button type="button" variant="outline" size="sm" onClick={() => editMenuItem(menuItem)} disabled={submitting}>
                          <RiPencilLine className="size-3" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteMenuItem(menuItem)}
                          disabled={deletingMenuItemId === menuItem.id}
                        >
                          <RiDeleteBinLine className="size-3" aria-hidden="true" />
                          {deletingMenuItemId === menuItem.id ? 'Deleting' : 'Delete'}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <form className="space-y-4 rounded-xl border border-border/70 bg-muted/10 p-4" onSubmit={submitMenuItem}>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{editingMenuItemId ? 'Edit menu item' : 'Add menu item'}</h3>
                <p className="text-xs text-muted-foreground">
                  Menu data is saved directly to the selected restaurant.
                </p>
              </div>

              <TextField
                id="menu-item-name"
                label="Item name"
                value={formValues.name}
                onChange={(value) => updateMenuField('name', value)}
                placeholder="Seasonal mezze plate"
                disabled={submitting}
                required
              />

              <div className="space-y-2">
                <label htmlFor="menu-item-description" className="text-xs font-medium">
                  Description
                </label>
                <Textarea
                  id="menu-item-description"
                  value={formValues.description}
                  onChange={(event) => updateMenuField('description', event.target.value)}
                  placeholder="Ingredients, preparation style, and pairing notes."
                  disabled={submitting}
                  className="min-h-24 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="menu-item-category" className="text-xs font-medium">
                  Category
                </label>
                <NativeSelect
                  id="menu-item-category"
                  value={formValues.categoryId}
                  onChange={(event) => updateMenuField('categoryId', event.target.value)}
                  disabled={submitting || categories.length === 0}
                  required
                  className="w-full"
                >
                  <NativeSelectOption value="" disabled>
                    Select category
                  </NativeSelectOption>
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px]">
                <TextField
                  id="menu-item-price"
                  label="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formValues.price}
                  onChange={(value) => updateMenuField('price', value)}
                  placeholder="12.50"
                  disabled={submitting}
                  required
                />
                <div className="space-y-2">
                  <label htmlFor="menu-item-currency" className="text-xs font-medium">
                    Currency
                  </label>
                  <NativeSelect
                    id="menu-item-currency"
                    value={formValues.currency}
                    onChange={(event) => updateMenuField('currency', event.target.value)}
                    disabled={submitting}
                    className="w-full"
                  >
                    <NativeSelectOption value="EUR">EUR</NativeSelectOption>
                    <NativeSelectOption value="TRY">TRY</NativeSelectOption>
                    <NativeSelectOption value="USD">USD</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>

              <TextField
                id="menu-item-sort-order"
                label="Sort order"
                type="number"
                min="0"
                step="1"
                value={formValues.sortOrder}
                onChange={(value) => updateMenuField('sortOrder', value)}
                placeholder="0"
                disabled={submitting}
              />

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
                <span>
                  <span className="block text-xs font-medium">Available</span>
                  <span className="block text-xs text-muted-foreground">
                    Hide an item temporarily without deleting it.
                  </span>
                </span>
                <Switch
                  checked={formValues.isAvailable}
                  onCheckedChange={(checked) => updateMenuField('isAvailable', checked)}
                  disabled={submitting}
                />
              </label>

              {message && <p className="text-xs text-primary">{message}</p>}
              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting || categories.length === 0}>
                  {submitting ? 'Saving...' : editingMenuItemId ? 'Update item' : 'Add item'}
                </Button>
                {editingMenuItemId && (
                  <Button type="button" variant="outline" onClick={resetMenuForm} disabled={submitting}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  step,
  disabled,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}

function emptyMenuItemFormValues(categoryId = ''): MenuItemFormValues {
  return {
    name: '',
    description: '',
    categoryId,
    price: '',
    currency: 'EUR',
    sortOrder: '0',
    isAvailable: true,
  };
}

function menuItemToFormValues(menuItem: MenuItem, fallbackCategoryId = ''): MenuItemFormValues {
  return {
    name: menuItem.name,
    description: menuItem.description ?? '',
    categoryId: menuItem.category?.id ?? fallbackCategoryId,
    price: String(menuItem.price),
    currency: menuItem.currency || 'EUR',
    sortOrder: String(menuItem.sort_order),
    isAvailable: menuItem.is_available,
  };
}

function buildMenuItemPayload(values: MenuItemFormValues) {
  const sortOrder = Number(values.sortOrder);

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category_id: values.categoryId,
    price: values.price.trim(),
    currency: values.currency.trim().toUpperCase() || 'EUR',
    is_available: values.isAvailable,
    sort_order: Number.isFinite(sortOrder) ? Math.max(0, Math.floor(sortOrder)) : 0,
  };
}

function sortMenuItems(menuItems: MenuItem[]): MenuItem[] {
  return [...menuItems].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order;
    }

    return first.name.localeCompare(second.name);
  });
}

function formatMenuPrice(value: unknown, currency: string): string {
  const amount = toFiniteNumber(value) ?? 0;
  const normalizedCurrency = currency.trim().toUpperCase() || 'EUR';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${normalizedCurrency}`;
  }
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}
