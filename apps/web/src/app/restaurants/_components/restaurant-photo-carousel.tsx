'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiFullscreenLine,
} from '@remixicon/react';
import { Button, cn } from 'ui-common';

type RestaurantPhotoCarouselProps = {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  showLightbox?: boolean;
};

export function RestaurantPhotoCarousel({
  images,
  alt,
  className,
  imageClassName,
  showLightbox = true,
}: RestaurantPhotoCarouselProps) {
  const photos = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const currentImage = photos[index] ?? photos[0];
  const hasMultiple = photos.length > 1;

  useEffect(() => {
    setIndex(0);
  }, [photos.join('|')]);

  function goPrevious() {
    setIndex((current) => (current - 1 + photos.length) % photos.length);
  }

  function goNext() {
    setIndex((current) => (current + 1) % photos.length);
  }

  if (!currentImage) {
    return null;
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <img
        src={currentImage}
        alt={alt}
        className={cn('h-full w-full object-cover', imageClassName)}
        loading="lazy"
      />

      {hasMultiple && (
        <div className="absolute inset-x-2 top-1/2 z-10 flex -translate-y-1/2 justify-between">
          <CarouselButton label="Previous photo" onClick={goPrevious}>
            <RiArrowLeftSLine className="size-5" aria-hidden="true" />
          </CarouselButton>
          <CarouselButton label="Next photo" onClick={goNext}>
            <RiArrowRightSLine className="size-5" aria-hidden="true" />
          </CarouselButton>
        </div>
      )}

      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between gap-2">
        {hasMultiple ? (
          <div className="flex gap-1 rounded-full bg-black/45 px-2 py-1 backdrop-blur">
            {photos.map((photo, photoIndex) => (
              <button
                key={`${photo}-${photoIndex}`}
                type="button"
                aria-label={`Show photo ${photoIndex + 1}`}
                onClick={(event) => {
                  event.preventDefault();
                  setIndex(photoIndex);
                }}
                className={cn(
                  'size-1.5 rounded-full bg-white/45 transition',
                  photoIndex === index && 'w-4 bg-white',
                )}
              />
            ))}
          </div>
        ) : (
          <span />
        )}
        {showLightbox && (
          <button
            type="button"
            aria-label="Open photo gallery"
            onClick={(event) => {
              event.preventDefault();
              setIsLightboxOpen(true);
            }}
            className="inline-flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
          >
            <RiFullscreenLine className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} gallery`}
        >
          <button
            type="button"
            aria-label="Close photo gallery"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <RiCloseLine className="size-5" aria-hidden="true" />
          </button>
          {hasMultiple && (
            <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
              <CarouselButton label="Previous photo" onClick={goPrevious}>
                <RiArrowLeftSLine className="size-6" aria-hidden="true" />
              </CarouselButton>
              <CarouselButton label="Next photo" onClick={goNext}>
                <RiArrowRightSLine className="size-6" aria-hidden="true" />
              </CarouselButton>
            </div>
          )}
          <img
            src={currentImage}
            alt={alt}
            className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="secondary"
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="rounded-full bg-white/85 text-foreground shadow-sm backdrop-blur hover:bg-white"
    >
      {children}
    </Button>
  );
}
