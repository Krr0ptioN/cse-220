import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'ui-common';
import { RiArrowRightLine, RiStore2Line } from '@remixicon/react';

export default function OwnerDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:px-6 sm:py-10">
      <section className="space-y-2">
        <Badge variant="secondary">Owner dashboard</Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, restaurant owner
        </h1>
        <p className="text-sm text-muted-foreground">
          This landing page is ready for CRUD integration (listing claim,
          profile edit, and review management).
        </p>
      </section>

      <Card className="border border-border/60">
        <CardHeader className="gap-1">
          <CardTitle className="inline-flex items-center gap-2">
            <RiStore2Line className="size-4" />
            Next actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Start from the public feed to verify your restaurant entries and
            ratings while owner workflows are being integrated.
          </p>

          <Button asChild>
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1"
            >
              Open restaurants list
              <RiArrowRightLine className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
