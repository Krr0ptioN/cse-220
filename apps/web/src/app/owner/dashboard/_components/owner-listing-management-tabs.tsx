'use client';

import { useMemo } from 'react';
import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  NativeSelect,
  NativeSelectOption,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Input,
} from 'ui-common';
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiImageLine,
  RiRestaurant2Line,
  RiStore2Line,
} from '@remixicon/react';

import { RestaurantPhotoCarousel } from '@/app/restaurants/_components/restaurant-photo-carousel';
import { OwnerHoursEditor } from './owner-hours-editor';
import { useOwnerDashboard } from './owner-dashboard-context';

export function OwnerListingManagementTabs() {
  const {
    selectedRestaurant,
    selectedRestaurantPreviewUrl,
    selectedRestaurantPhotoUrls,
    formValues,
    categories,
    editingSlug,
    isSubmitting,
    loadWarning,
    message,
    error,
    onSubmit,
    resetForm,
    updateField,
    setPrimaryPhoto,
    deleteRestaurantPhoto,
  } = useOwnerDashboard();

  const statusText = useMemo(() => {
    if (editingSlug) {
      return 'Editing existing listing';
    }

    return 'Creating a new listing';
  }, [editingSlug]);

  return (
    <Card className="border border-border/70 bg-card shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/70">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <RiStore2Line className="size-4 text-muted-foreground" aria-hidden="true" />
              Listing management
            </CardTitle>
            <CardDescription>
              Switch between listing details, gallery management, and opening hours.
            </CardDescription>
          </div>
          <Badge variant="secondary">{statusText}</Badge>
        </div>
        {(message || error || loadWarning) && (
          <div className="space-y-2">
            {loadWarning && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {loadWarning}
              </p>
            )}
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
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <Tabs defaultValue="details" className="space-y-5">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="details">
                <RiStore2Line className="size-4" aria-hidden="true" />
                Owned listing
              </TabsTrigger>
              <TabsTrigger value="gallery">
                <RiImageLine className="size-4" aria-hidden="true" />
                Gallery management
              </TabsTrigger>
              <TabsTrigger value="hours">
                <RiCalendarLine className="size-4" aria-hidden="true" />
                Opening hours
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-2">
              <section className="grid gap-4 lg:grid-cols-2">
                <TextField
                  id="restaurant-name"
                  label="Restaurant name"
                  value={formValues.name}
                  onChange={(value) => updateField('name', value)}
                  placeholder="Ada Bistro"
                  disabled={isSubmitting}
                  required
                />
                <div className="space-y-2">
                  <label htmlFor="restaurant-category" className="text-xs font-medium">
                    Category
                  </label>
                  <NativeSelect
                    id="restaurant-category"
                    value={formValues.categoryId}
                    onChange={(event) => updateField('categoryId', event.target.value)}
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
              </section>

              <div className="space-y-2">
                <label htmlFor="restaurant-description" className="text-xs font-medium">
                  Description
                </label>
                <Textarea
                  id="restaurant-description"
                  value={formValues.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Describe the food, atmosphere, and what makes this place worth visiting."
                  required
                  disabled={isSubmitting}
                  className="min-h-24"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="address-line-1"
                  label="Street address"
                  value={formValues.addressLine1}
                  onChange={(value) => updateField('addressLine1', value)}
                  placeholder="Main Street 1"
                  disabled={isSubmitting}
                  required
                />
                <div className="space-y-2">
                  <label htmlFor="price-range" className="text-xs font-medium">
                    Price range
                  </label>
                  <NativeSelect
                    id="price-range"
                    value={formValues.priceRange}
                    onChange={(event) => updateField('priceRange', event.target.value)}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    <NativeSelectOption value="1">Low</NativeSelectOption>
                    <NativeSelectOption value="2">Medium</NativeSelectOption>
                    <NativeSelectOption value="3">High</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="city"
                  label="City"
                  value={formValues.city}
                  onChange={(value) => updateField('city', value)}
                  placeholder="Istanbul"
                  disabled={isSubmitting}
                  required
                />
                <TextField
                  id="district"
                  label="District"
                  value={formValues.district}
                  onChange={(value) => updateField('district', value)}
                  placeholder="Kadikoy"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id="phone"
                  label="Phone"
                  value={formValues.phone}
                  onChange={(value) => updateField('phone', value)}
                  placeholder="+90 555 0101"
                  disabled={isSubmitting}
                />
                <TextField
                  id="website"
                  label="Website"
                  type="url"
                  value={formValues.website}
                  onChange={(value) => updateField('website', value)}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                />
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4 pt-2">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <Card className="border border-border/70 bg-muted/10 shadow-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <RiImageLine className="size-4 text-muted-foreground" aria-hidden="true" />
                      Cover preview
                    </CardTitle>
                    <CardDescription>
                      Primary photo and the current gallery for the selected restaurant.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/20">
                      <AspectRatio ratio={16 / 10}>
                        {selectedRestaurantPreviewUrl ? (
                          <RestaurantPhotoCarousel
                            images={
                              selectedRestaurantPhotoUrls.length
                                ? selectedRestaurantPhotoUrls
                                : [selectedRestaurantPreviewUrl]
                            }
                            alt={selectedRestaurant?.name || 'Restaurant preview'}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,oklch(0.98_0.01_90),oklch(0.94_0.02_86))] text-muted-foreground">
                            <RiImageLine className="size-12" aria-hidden="true" />
                          </div>
                        )}
                      </AspectRatio>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="primary-photo" className="text-xs font-medium">
                        Primary photo
                      </label>
                      <div className="rounded-xl border border-dashed border-border/80 bg-background p-4">
                        <input
                          id="primary-photo"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) =>
                            updateField('primaryPhotoFile', event.target.files?.[0] ?? null)
                          }
                          disabled={isSubmitting}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          JPG, PNG, or WebP. Uploading a primary image updates the front image.
                        </p>
                        {(formValues.primaryPhotoFile || formValues.primaryPhotoUrl) && (
                          <p className="mt-2 text-xs font-medium text-foreground">
                            {formValues.primaryPhotoFile?.name || 'Existing photo loaded'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="gallery-photos" className="text-xs font-medium">
                        Gallery photos
                      </label>
                      <div className="rounded-xl border border-dashed border-border/80 bg-background p-4">
                        <input
                          id="gallery-photos"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={(event) =>
                            updateField('galleryPhotoFiles', Array.from(event.target.files ?? []))
                          }
                          disabled={isSubmitting}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Upload multiple JPG, PNG, or WebP images for the public gallery.
                        </p>
                        {formValues.galleryPhotoFiles.length > 0 && (
                          <p className="mt-2 text-xs font-medium text-foreground">
                            {formValues.galleryPhotoFiles.length} gallery photo
                            {formValues.galleryPhotoFiles.length === 1 ? '' : 's'} selected
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/70 bg-muted/10 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Current photos</CardTitle>
                    <CardDescription>
                      Promote one image or remove outdated photos from the restaurant gallery.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedRestaurant?.photos?.length ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRestaurant.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="overflow-hidden rounded-xl border border-border/70 bg-background"
                          >
                            <button
                              type="button"
                              onClick={() => void setPrimaryPhoto(photo)}
                              className="relative block aspect-video w-full overflow-hidden"
                              aria-label="Set primary photo"
                            >
                              <img src={photo.url} alt="" className="h-full w-full object-cover" />
                              {photo.is_primary && (
                                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                  Primary
                                </span>
                              )}
                            </button>
                            <div className="flex gap-1 p-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 flex-1 px-2 text-[11px]"
                                onClick={() => void setPrimaryPhoto(photo)}
                              >
                                Set primary
                              </Button>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                aria-label="Delete photo"
                                onClick={() => void deleteRestaurantPhoto(photo)}
                              >
                                <RiDeleteBinLine className="size-3.5" aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                        No gallery photos yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hours" className="space-y-4 pt-2">
              <Card className="border border-border/70 bg-muted/10 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RiCalendarLine className="size-4 text-muted-foreground" aria-hidden="true" />
                    Opening hours
                  </CardTitle>
                  <CardDescription>
                    These hours power the public open, closed, and closing-soon labels.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OwnerHoursEditor
                    value={formValues.openingHours}
                    onChange={(openingHours) => updateField('openingHours', openingHours)}
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
            <Button type="submit" disabled={isSubmitting || categories.length === 0}>
              {isSubmitting ? 'Saving...' : editingSlug ? 'Update listing' : 'Create listing'}
            </Button>
            {editingSlug && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
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
