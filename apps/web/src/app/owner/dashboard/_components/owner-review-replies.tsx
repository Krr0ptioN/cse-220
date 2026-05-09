import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui-common';

export function OwnerReviewReplies() {
  return (
    <Card className="border border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Review replies</CardTitle>
        <CardDescription>
          The active reply workflow is composed from the owner dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Owners can respond to recent diner reviews for the selected restaurant.
      </CardContent>
    </Card>
  );
}
