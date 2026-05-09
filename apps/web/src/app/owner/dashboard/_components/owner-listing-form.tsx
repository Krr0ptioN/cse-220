'use client';

import type { FormEvent } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  NativeSelect,
  NativeSelectOption,
  Textarea,
} from 'ui-common';

import type { RestaurantCategory } from '@/lib/restaurants';
import type { RestaurantFormValues } from '../_lib/owner-dashboard-utils';
import { OwnerHoursEditor } from './owner-hours-editor';

export function OwnerListingForm({
  categories,
  editingSlug,
  formValues,
  isSubmitting,
  loadWarning,
  message,
  error,
  onSubmit,
  onCancelEdit,
  onUpdateField,
}: {
  categories: RestaurantCategory[];
  editingSlug: string | null;
  formValues: RestaurantFormValues;
  isSubmitting: boolean;
  loadWarning: string | null;
  message: string | null;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onUpdateField: <K extends keyof RestaurantFormValues>(
    field: K,
    value: RestaurantFormValues[K],
  ) => void;
}) {
  return (
    <Card className="border border-border/70 bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle>{editingSlug ? 'Edit listing' : 'Create a listing'}</CardTitle>
        <CardDescription>
          {editingSlug
            ? 'Update core details for the selected restaurant.'
            : 'Create or add another restaurant under your owner account.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadWarning && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {loadWarning}
          </p>
        )}
        <form className="space-y-4" onSubmit={onSubmit}>
          <TextField
            id="restaurant-name"
            label="Restaurant name"
            value={formValues.name}
            onChange={(value) => onUpdateField('name', value)}
            placeholder="Ada Bistro"
            disabled={isSubmitting}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="restaurant-category" className="text-xs font-medium">
                Category
              </label>
              <NativeSelect
                id="restaurant-category"
                value={formValues.categoryId}
                onChange={(event) => onUpdateField('categoryId', event.target.value)}
                required
                disabled={isSubmitting || categories.length === 0}
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
            <div className="space-y-2">
              <label htmlFor="price-range" className="text-xs font-medium">
                Price range
              </label>
              <NativeSelect
                id="price-range"
                value={formValues.priceRange}
                onChange={(event) => onUpdateField('priceRange', event.target.value)}
                disabled={isSubmitting}
                className="w-full"
              >
                <NativeSelectOption value="1">Low</NativeSelectOption>
                <NativeSelectOption value="2">Medium</NativeSelectOption>
                <NativeSelectOption value="3">High</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="restaurant-description" className="text-xs font-medium">
              Description
            </label>
            <Textarea
              id="restaurant-description"
              value={formValues.description}
              onChange={(event) => onUpdateField('description', event.target.value)}
              placeholder="Describe the food, atmosphere, and what makes this place worth visiting."
              required
              disabled={isSubmitting}
              className="min-h-24"
            />
          </div>

          <TextField
            id="address-line-1"
            label="Street address"
            value={formValues.addressLine1}
            onChange={(value) => onUpdateField('addressLine1', value)}
            placeholder="Main Street 1"
            disabled={isSubmitting}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="city"
              label="City"
              value={formValues.city}
              onChange={(value) => onUpdateField('city', value)}
              placeholder="Istanbul"
              disabled={isSubmitting}
              required
            />
            <TextField
              id="district"
              label="District"
              value={formValues.district}
              onChange={(value) => onUpdateField('district', value)}
              placeholder="Kadikoy"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="phone"
              label="Phone"
              value={formValues.phone}
              onChange={(value) => onUpdateField('phone', value)}
              placeholder="+90 555 0101"
              disabled={isSubmitting}
            />
            <TextField
              id="website"
              label="Website"
              type="url"
              value={formValues.website}
              onChange={(value) => onUpdateField('website', value)}
              placeholder="https://example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Opening hours</h3>
              <p className="text-xs text-muted-foreground">
                These hours power the public open, closed, and closing-soon labels.
              </p>
            </div>
            <OwnerHoursEditor
              value={formValues.openingHours}
              onChange={(openingHours) => onUpdateField('openingHours', openingHours)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="primary-photo" className="text-xs font-medium">
              Primary photo
            </label>
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
              <input
                id="primary-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  onUpdateField('primaryPhotoFile', event.target.files?.[0] ?? null)
                }
                disabled={isSubmitting}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG, or WebP. Uploads replace the current front image.
              </p>
              {(formValues.primaryPhotoFile || formValues.primaryPhotoUrl) && (
                <p className="mt-2 text-xs font-medium text-foreground">
                  {formValues.primaryPhotoFile?.name || 'Existing photo loaded'}
                </p>
              )}
            </div>
          </div>

          {message && (
            <p className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting || categories.length === 0}>
              {isSubmitting ? 'Saving...' : editingSlug ? 'Update listing' : 'Create listing'}
            </Button>
            {editingSlug && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEdit}
                disabled={isSubmitting}
              >
                Cancel edit
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  required,
  min,
  step,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        step={step}
      />
    </div>
  );
}
