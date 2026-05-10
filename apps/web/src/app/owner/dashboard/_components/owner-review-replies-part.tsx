'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Textarea } from 'ui-common';

import { submitReview, fetchRestaurantReviews, type Review } from '@/lib/reviews';
import { useOwnerDashboard } from './owner-dashboard-context';

export function OwnerReviewRepliesPart() {
  const { selectedRestaurant } = useOwnerDashboard();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedRestaurant) {
      setReviews([]);
      return;
    }

    const restaurant = selectedRestaurant;
    let ignore = false;

    async function loadReviews() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchRestaurantReviews(restaurant.slug, 1, 5);
        if (!ignore) {
          setReviews(response.data);
        }
      } catch {
        if (!ignore) {
          setError('Unable to load recent reviews.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadReviews();
    return () => {
      ignore = true;
    };
  }, [selectedRestaurant]);

  async function submitReply(review: Review) {
    if (!selectedRestaurant) return;

    const content = (replyDrafts[review.id] ?? '').trim();
    if (!content) {
      setError('Write a reply before sending.');
      return;
    }

    setSubmittingId(review.id);
    setError(null);
    setMessage(null);

    const result = await submitReview(selectedRestaurant.slug, review.rating, content, review.id);

    if (result.success && result.review) {
      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? { ...item, replies: [...(item.replies ?? []), result.review as Review] }
            : item,
        ),
      );
      setReplyDrafts((current) => ({ ...current, [review.id]: '' }));
      setMessage('Reply posted.');
    } else {
      setError(result.error || 'Unable to post reply.');
    }

    setSubmittingId(null);
  }

  const openReviews = reviews.filter(
    (review) => !review.replies?.some((reply) => reply.is_business_answer),
  );

  return (
    <Card className="border border-border/70 bg-card/90 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle>Review replies</CardTitle>
        <CardDescription>
          Respond to recent diner reviews for the selected restaurant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedRestaurant ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Create or select a restaurant before replying to reviews.
          </div>
        ) : isLoading ? (
          <div className="space-y-2 text-sm text-muted-foreground">Loading recent reviews...</div>
        ) : openReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No unreplied reviews right now.
          </div>
        ) : (
          openReviews.map((review) => (
            <article key={review.id} className="space-y-3 rounded-lg border border-border/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{review.user.display_name}</p>
                  <p className="text-xs text-muted-foreground">{review.content}</p>
                </div>
                <Badge variant="secondary">{review.rating}/5</Badge>
              </div>
              <Textarea
                value={replyDrafts[review.id] ?? ''}
                onChange={(event) =>
                  setReplyDrafts((current) => ({
                    ...current,
                    [review.id]: event.target.value,
                  }))
                }
                placeholder="Write an owner reply..."
                className="min-h-20 text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingId === review.id}
                  onClick={() => void submitReply(review)}
                >
                  {submittingId === review.id ? 'Posting...' : 'Post reply'}
                </Button>
              </div>
            </article>
          ))
        )}
        {message && <p className="text-xs text-primary">{message}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
