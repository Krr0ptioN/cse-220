import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'ui-common';

export function MapModuleShell() {
  return (
    <Card className="border border-border/70 bg-card">
      <CardHeader>
        <CardTitle>Map module scaffold</CardTitle>
        <CardDescription>
          Module-oriented shell ready for map canvas, layers, filters, and side
          panels.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Keep map-specific UI and logic inside <code>libs/ui/modules/map</code>.
      </CardContent>
    </Card>
  );
}
