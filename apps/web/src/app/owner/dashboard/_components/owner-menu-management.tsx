import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui-common';

export function OwnerMenuManagement() {
  return (
    <Card className="border border-border/70 bg-card shadow-sm">
      <CardHeader>
        <CardTitle>Menu management</CardTitle>
        <CardDescription>
          The active menu CRUD implementation is composed from the owner dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Menu items can be created, edited, and removed for the selected restaurant.
      </CardContent>
    </Card>
  );
}
