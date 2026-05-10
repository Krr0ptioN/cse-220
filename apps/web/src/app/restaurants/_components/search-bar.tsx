'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input } from 'ui-common';
import {
  RiCloseLine,
  RiFilter3Line,
  RiMapPinLine,
  RiSearchLine,
} from '@remixicon/react';

interface SearchBarProps {
  value: string;
  locationValue: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onLocationSubmit: (value: string) => void;
  onUseCurrentLocation: (coords: { latitude: number; longitude: number }) => void;
  onClear: () => void;
  onLocationClear: () => void;
  activeFilterCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function SearchBar({
  value,
  locationValue,
  onChange,
  onSubmit,
  onLocationSubmit,
  onUseCurrentLocation,
  onClear,
  onLocationClear,
  activeFilterCount,
  showFilters,
  onToggleFilters,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const [locationInput, setLocationInput] = useState(locationValue);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    setLocationInput(locationValue);
  }, [locationValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue('');
    onClear();
  };

  const handleLocationSubmit = () => {
    const normalizedLocation = locationInput.trim();
    setLocationError(null);
    if (!normalizedLocation) {
      onLocationClear();
      return;
    }

    onLocationSubmit(normalizedLocation);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not available in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onUseCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        setLocationError('Unable to read your location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  return (
    <form
      className="rounded-[1.25rem] border border-border/70 bg-background/92 p-3 shadow-xl shadow-black/5 backdrop-blur-xl"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="Search restaurants, cuisines, neighborhoods..."
            className="h-11 rounded-full border-border/70 pl-9 pr-10 text-sm shadow-sm focus-visible:ring-1"
          />
          {inputValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition hover:text-foreground"
            >
              <RiCloseLine className="size-4" />
            </button>
          ) : null}
        </div>

        <Button
          type="button"
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="relative h-11 rounded-full px-3 text-xs"
          onClick={onToggleFilters}
        >
          <RiFilter3Line className="size-4" />
          <span className="ml-1 hidden sm:inline">Filters</span>
          {activeFilterCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-0 flex-1">
          <RiMapPinLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Search by city or neighborhood"
            className="h-10 rounded-full border-border/70 pl-9 pr-10 text-sm shadow-sm focus-visible:ring-1"
          />
          {locationInput ? (
            <button
              type="button"
              onClick={() => {
                setLocationInput('');
                onLocationClear();
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition hover:text-foreground"
            >
              <RiCloseLine className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-full px-3 text-xs"
            onClick={handleLocationSubmit}
          >
            Search area
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-full px-3 text-xs"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
          >
            <RiMapPinLine className="size-4" />
            <span className="hidden sm:inline">
              {isLocating ? 'Locating...' : 'Use my location'}
            </span>
          </Button>
        </div>
      </div>

      {locationError ? (
        <p className="mt-2 text-xs text-destructive">{locationError}</p>
      ) : null}

      <div className="mt-2 flex items-center justify-end lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 rounded-full px-3 text-xs"
          onClick={onToggleFilters}
        >
          {showFilters ? 'Hide filters' : 'Show filters'}
        </Button>
      </div>
    </form>
  );
}
