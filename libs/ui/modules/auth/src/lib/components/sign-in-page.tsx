import { RiShieldUserLine, RiStore2Line } from '@remixicon/react';

import { type AuthVariant } from '../flow';
import { SignInForm } from '../forms/sign-in';
import { StatCard } from './stats-card';

interface AuthSignInPageProps {
  variant?: AuthVariant;
}

export function AuthSignInPage({ variant = 'reviewer' }: AuthSignInPageProps) {
  const isOwner = variant === 'owner';

  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,oklch(0.98_0.03_85),transparent_34rem),linear-gradient(180deg,oklch(1_0_0),oklch(0.985_0.012_90))] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <SignInForm
          title="Welcome back"
          description="Sign in to continue to your FlavorMap account."
        />
      </section>

      <aside className="hidden border-l border-border/60 bg-muted/20 lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md space-y-5 px-10">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isOwner ? (
              <RiStore2Line className="size-6" aria-hidden="true" />
            ) : (
              <RiShieldUserLine className="size-6" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isOwner
                ? 'A cleaner way to manage your listing'
                : 'Reviews that help people decide'}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {isOwner
                ? 'FlavorMap keeps the owner workflow focused: core details, ratings, and the next steps your guests see first.'
                : 'Find restaurants, compare details, and add feedback that makes the next visit easier for everyone.'}
            </p>
          </div>

          <div className="grid gap-3">
            <StatCard
              label={isOwner ? 'Owner tools' : 'Diner tools'}
              value={isOwner ? 'Profile, replies, updates' : 'Browse, react, comment'}
            />
            <StatCard
              label="What happens next"
              value={isOwner ? 'Dashboard after sign in' : 'Restaurants after sign in'}
            />
          </div>
        </div>
      </aside>
    </main>
  );
}
