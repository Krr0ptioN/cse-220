'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Input,
  Skeleton,
} from 'ui-common';
import {
  RiAlertLine,
  RiCloseLine,
  RiFilter3Line,
  RiMapPin2Fill,
  RiMapPinLine,
  RiMenuLine,
  RiRouteLine,
  RiSearchLine,
  RiStarFill,
  RiTimeLine,
} from '@remixicon/react';
import Link from 'next/link';

import {
  buildRestaurantsUrl,
  getRestaurantCoverImage,
  getRestaurantDistanceKm,
  getRestaurantIsOpen,
  normalizeRestaurantsResponse,
  type PaginationMeta,
  type Restaurant,
} from '../../lib/restaurants';

const DEFAULT_PAGE_SIZE = 12;

type ExploreViewProps = {
  initialQuery: string;
  initialPage: number;
};

export function ExploreView({ initialQuery, initialPage }: ExploreViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = (searchParams.get('q') ?? initialQuery).trim();
  const page = toPositiveInt(searchParams.get('page')) ?? initialPage;

  const [inputValue, setInputValue] = useState(query);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page,
    page_size: DEFAULT_PAGE_SIZE,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showListMobile, setShowListMobile] = useState(true);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRestaurants() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          buildRestaurantsUrl(page, DEFAULT_PAGE_SIZE, query),
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        const normalized = normalizeRestaurantsResponse(payload);

        const locallyFiltered = applyLocalFilter(normalized.data, query);
        const clientFiltered = applyClientFilters(
          locallyFiltered,
          selectedPrice,
          selectedRating,
        );

        setRestaurants(clientFiltered);
        setPagination(normalized.pagination);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRestaurants([]);
        setErrorMessage(
          error instanceof Error
            ? `Could not load restaurants right now (${error.message}).`
            : 'Could not load restaurants right now.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadRestaurants();

    return () => controller.abort();
  }, [page, query, selectedPrice, selectedRating]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    replaceSearchParams({ q: inputValue.trim() || null, page: '1' });
  }

  function handleClearSearch() {
    setInputValue('');
    replaceSearchParams({ q: null, page: '1' });
  }

  function goToPage(nextPage: number) {
    replaceSearchParams({ page: String(nextPage) });
  }

  function replaceSearchParams(updates: Record<string, string | null>) {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function clearAllFilters() {
    setSelectedPrice(null);
    setSelectedRating(null);
  }

  const activeFilterCount = [selectedPrice, selectedRating].filter(
    Boolean,
  ).length;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top search bar */}
      <header className="relative z-30 flex shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur sm:px-4">
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={handleSearchSubmit}
        >
          <div className="relative flex-1">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search restaurants, cuisines, neighborhoods..."
              className="h-10 rounded-full border-border/70 pl-9 pr-10 text-sm shadow-sm focus-visible:ring-1"
            />
            {inputValue ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <RiCloseLine className="size-4" />
              </button>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`relative h-10 rounded-full px-3 text-xs ${activeFilterCount > 0 ? 'border-primary/50 bg-primary/5 text-primary' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <RiFilter3Line className="size-4" />
            <span className="ml-1 hidden sm:inline">Filters</span>
            {activeFilterCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </form>

        {/* Mobile toggle: list / map */}
        <Button
          variant="outline"
          size="sm"
          className="h-10 rounded-full px-3 lg:hidden"
          onClick={() => setShowListMobile(!showListMobile)}
        >
          {showListMobile ? (
            <RiMapPin2Fill className="size-4" />
          ) : (
            <RiMenuLine className="size-4" />
          )}
        </Button>
      </header>

      {/* Filter bar */}
      {showFilters && (
        <div className="relative z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            Price:
          </span>
          {['1', '2', '3'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPrice(selectedPrice === p ? null : p)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedPrice === p
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              {'€'.repeat(Number(p))}
            </button>
          ))}

          <span className="ml-2 text-xs font-medium text-muted-foreground">
            Rating:
          </span>
          {[3, 4, 4.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRating(selectedRating === r ? null : r)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedRating === r
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <RiStarFill className="size-3 text-amber-500" />
              {r}+
            </button>
          ))}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Main split: map + list */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Map panel */}
        <div
          className={`relative hidden flex-1 overflow-hidden bg-[radial-gradient(circle_at_30%_30%,_#f8fbff,_#eef4fa_55%,_#e8eef7_100%)] lg:block ${
            showListMobile ? 'lg:flex' : 'flex'
          }`}
        >
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(90deg,transparent_0,transparent_48%,rgba(163,181,205,.2)_50%,transparent_52%,transparent_100%),linear-gradient(180deg,transparent_0,transparent_48%,rgba(163,181,205,.18)_50%,transparent_52%,transparent_100%)] [background-size:56px_56px]" />

          {/* Roads */}
          <div className="absolute inset-0">
            <div className="absolute top-[35%] left-0 h-1 w-full bg-white/70 shadow-sm" />
            <div className="absolute top-[60%] left-0 h-0.5 w-full bg-white/50" />
            <div className="absolute top-0 left-[40%] h-full w-1 bg-white/70 shadow-sm" />
            <div className="absolute top-0 left-[70%] h-full w-0.5 bg-white/50" />
          </div>

          {/* Markers */}
          {restaurants.map((restaurant, index) => {
            const marker = markerPositions[index % markerPositions.length];
            const isHovered = hoveredId === restaurant.id;

            return (
              <button
                key={restaurant.id}
                type="button"
                onMouseEnter={() => setHoveredId(restaurant.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`absolute z-10 inline-flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold shadow-lg transition-all duration-150 ${
                  isHovered
                    ? 'z-20 scale-110 border-primary bg-primary text-primary-foreground'
                    : 'border-white/80 bg-white/95 text-foreground backdrop-blur-sm hover:border-primary/50'
                }`}
                style={{ left: marker.left, top: marker.top }}
              >
                {isHovered ? (
                  <span className="max-w-28 truncate">{restaurant.name}</span>
                ) : (
                  <>
                    <RiStarFill className="size-3 text-amber-500" />
                    {restaurant.average_rating?.toFixed(1) ?? '4.5'}
                  </>
                )}
              </button>
            );
          })}

          {/* Map legend */}
          <div className="absolute right-3 bottom-3 rounded-lg border border-border/70 bg-white/90 px-3 py-2 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
            {query
              ? `Results for "${query}"`
              : `${restaurants.length} places nearby`}
          </div>
        </div>

        {/* List panel */}
        <div
          className={`flex flex-col overflow-hidden border-r border-border/60 bg-muted/10 ${
            showListMobile ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-[420px] lg:shrink-0 lg:border-r`}
        >
          {/* Results count */}
          <div className="shrink-0 border-b border-border/60 bg-background px-4 py-2 text-xs text-muted-foreground">
            {isLoading
              ? 'Searching...'
              : `${pagination.total} result${pagination.total !== 1 ? 's' : ''} found`}
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="px-4 py-3">
              <Alert variant="destructive">
                <RiAlertLine className="size-4" />
                <AlertTitle>Unable to load</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Loading */}
          {isLoading && !errorMessage && (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/60 bg-card p-3"
                >
                  <Skeleton className="mb-2 h-32 w-full rounded-lg" />
                  <Skeleton className="mb-1.5 h-4 w-3/4" />
                  <Skeleton className="mb-1 h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !errorMessage && restaurants.length === 0 && (
            <div className="flex-1 p-4">
              <Empty className="border border-dashed border-border">
                <EmptyHeader>
                  <EmptyTitle>No restaurants found</EmptyTitle>
                  <EmptyDescription>
                    Try adjusting your search or filters.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}

          {/* Results list */}
          {!isLoading && !errorMessage && restaurants.length > 0 && (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {restaurants.map((restaurant) => (
                <RestaurantListItem
                  key={restaurant.id}
                  restaurant={restaurant}
                  isHovered={hoveredId === restaurant.id}
                  onHover={() => setHoveredId(restaurant.id)}
                  onLeave={() => setHoveredId(null)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="shrink-0 border-t border-border/60 bg-background px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Page {pagination.page} of{' '}
                  {Math.max(1, pagination.total_pages)}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    disabled={!pagination.has_previous || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-3 text-xs"
                    onClick={() => goToPage(page + 1)}
                    disabled={!pagination.has_next || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type RestaurantListItemProps = {
  restaurant: Restaurant;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
};

function RestaurantListItem({
  restaurant,
  isHovered,
  onHover,
  onLeave,
}: RestaurantListItemProps) {
  const imageUrl = getRestaurantCoverImage(restaurant.slug);
  const distanceKm = getRestaurantDistanceKm(restaurant.slug);
  const isOpen = getRestaurantIsOpen(restaurant.slug);

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`group block overflow-hidden rounded-xl border transition-all duration-200 ${
        isHovered
          ? 'border-primary/50 bg-card shadow-md ring-1 ring-primary/10'
          : 'border-border/60 bg-card/80 hover:border-border hover:shadow-sm'
      }`}
    >
      <div className="flex">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30" />
        </div>

        <div className="flex flex-1 flex-col justify-between p-3">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-foreground">
                {restaurant.name}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                <RiStarFill className="size-3 text-amber-500" />
                {restaurant.average_rating?.toFixed(1) ?? 'N/A'}
              </span>
            </div>

            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {restaurant.description?.trim() || 'Neighborhood favorite.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <RiMapPinLine className="size-3" />
              {restaurant.city || 'Unknown'}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <RiRouteLine className="size-3" />
              {distanceKm.toFixed(1)} km
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] ${
                isOpen ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              <RiTimeLine className="size-3" />
              {isOpen ? 'Open' : 'Closed'}
            </span>
            {restaurant.category?.name && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {restaurant.category.name}
              </Badge>
            )}
            {restaurant.price_range && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                {restaurant.price_range}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function toPositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function applyLocalFilter(items: Restaurant[], query: string): Restaurant[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [
      item.name,
      item.description,
      item.category?.name,
      item.city,
      item.district,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

function applyClientFilters(
  items: Restaurant[],
  price: string | null,
  rating: number | null,
): Restaurant[] {
  let filtered = items;

  if (price) {
    filtered = filtered.filter((r) => r.price_range === price);
  }

  if (rating !== null) {
    filtered = filtered.filter((r) => (r.average_rating ?? 0) >= rating);
  }

  return filtered;
}

const markerPositions = [
  { left: '22%', top: '30%' },
  { left: '45%', top: '55%' },
  { left: '68%', top: '25%' },
  { left: '35%', top: '70%' },
  { left: '78%', top: '60%' },
  { left: '15%', top: '45%' },
  { left: '55%', top: '38%' },
  { left: '85%', top: '42%' },
  { left: '30%', top: '20%' },
  { left: '60%', top: '75%' },
  { left: '42%', top: '15%' },
  { left: '72%', top: '80%' },
];
