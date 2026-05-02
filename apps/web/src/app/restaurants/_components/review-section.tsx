'use client';

import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, CardContent, Textarea } from 'ui-common';
import {
  RiChatSmileLine,
  RiCloseLine,
  RiStarFill,
  RiStarLine,
  RiThumbDownLine,
  RiThumbUpLine,
} from '@remixicon/react';

import type { Review } from '../../lib/reviews';
import { submitReview } from '../../lib/reviews';

type ReviewSectionProps = {
  restaurantSlug: string;
  restaurantName: string;
  initialReviews: Review[];
  totalReviews: number;
};

export function ReviewSection({
  restaurantSlug,
  restaurantName,
  initialReviews,
  totalReviews,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>(
    {},
  );

  const ratingLabel =
    rating <= 0
      ? 'Select a rating'
      : rating <= 2
        ? 'Needs improvement'
        : rating === 3
          ? 'Good overall'
          : 'Excellent experience';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: { rating?: string; comment?: string } = {};
    if (rating < 1) nextErrors.rating = 'Please choose a rating.';
    if (comment.trim().length < 20)
      nextErrors.comment = 'Please write at least 20 characters.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitReview(restaurantSlug, rating, comment.trim());

    if (result.success) {
      setSubmitSuccess(true);
      setReviews((prev) => [
        {
          id: `local-${Date.now()}`,
          user: { id: 'you', display_name: 'You', username: 'you' },
          rating,
          content: comment.trim(),
          like_count: 0,
          dislike_count: 0,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setRating(0);
      setComment('');
      setShowForm(false);
    } else {
      setSubmitError(result.error || 'Failed to submit review.');
    }

    setIsSubmitting(false);
  }

  function resetForm() {
    setShowForm(false);
    setRating(0);
    setComment('');
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reviews</h2>
          <p className="text-sm text-muted-foreground">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''} from diners
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <RiChatSmileLine className="size-4" />
            Write a review
          </Button>
        )}
      </div>

      {submitSuccess && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex items-center justify-between py-3">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Review submitted successfully!
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSubmitSuccess(false)}
            >
              <RiCloseLine className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Your rating</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const score = i + 1;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setRating(score)}
                        className="rounded p-0.5 transition-colors hover:text-amber-500"
                      >
                        {score <= rating ? (
                          <RiStarFill className="size-5 text-amber-500" />
                        ) : (
                          <RiStarLine className="size-5" />
                        )}
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {ratingLabel}
                  </span>
                </div>
              </div>
              {errors.rating && (
                <p className="text-xs text-destructive">{errors.rating}</p>
              )}

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share your experience at ${restaurantName}...`}
                className="min-h-28 text-sm"
              />
              {errors.comment && (
                <p className="text-xs text-destructive">{errors.comment}</p>
              )}

              {submitError && (
                <p className="text-xs text-destructive">{submitError}</p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || rating < 1}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {reviews.length ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No reviews yet. Be the first to share your experience!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const date = new Date(review.created_at);
  const timeAgo = getTimeAgo(date);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {review.user.display_name[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {review.user.display_name}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <RiStarFill
                  key={i}
                  className={`size-3.5 ${i < review.rating ? 'text-amber-500' : 'text-muted'}`}
                />
              ))}
              <Badge variant="secondary" className="ml-1 text-xs">
                {review.rating}/5
              </Badge>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {review.content}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLiked(!liked);
              if (disliked) setDisliked(false);
            }}
            className={`inline-flex items-center gap-1 text-xs transition-colors ${
              liked
                ? 'text-green-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RiThumbUpLine className="size-4" />
            {review.like_count + (liked ? 1 : 0)}
          </button>
          <button
            type="button"
            onClick={() => {
              setDisliked(!disliked);
              if (liked) setLiked(false);
            }}
            className={`inline-flex items-center gap-1 text-xs transition-colors ${
              disliked
                ? 'text-red-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RiThumbDownLine className="size-4" />
            {review.dislike_count + (disliked ? 1 : 0)}
          </button>
        </div>

        {review.replies?.map((reply) => (
          <div
            key={reply.id}
            className="mt-3 ml-4 border-l-2 border-border pl-3"
          >
            <p className="text-xs font-medium">
              {reply.user.display_name}
              <span className="ml-1 font-normal text-muted-foreground">
                replied {getTimeAgo(new Date(reply.created_at))}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {reply.content}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
