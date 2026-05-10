import {
  RiShieldUserLine,
  RiStore2Line,
  RiUserAddLine,
  RiUserSettingsLine,
  RiUserStarLine,
} from '@remixicon/react';
import { Separator } from 'ui-common';

import { type AuthVariant } from '../flow';
import { InfoTile } from './info-tile';
import { OwnerSignUp } from './owner-sign-up';
import { ReviewerSignUp } from './reviewer-sign-up';
import { StatCard } from './stats-card';

interface AuthSignUpPageProps {
  variant: AuthVariant;
}

export function AuthSignUpPage({ variant }: AuthSignUpPageProps) {
  const isOwner = variant === 'owner';

  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top_right,oklch(0.97_0.03_84),transparent_34rem),linear-gradient(180deg,oklch(1_0_0),oklch(0.985_0.012_90))] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        {isOwner ? <OwnerSignUp /> : <ReviewerSignUp />}
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
                ? 'Create your restaurant profile once, then keep the listing current with photos, details, and owner replies.'
                : 'Join the reviewer path to search restaurants, compare details, and leave useful feedback in one place.'}
            </p>
          </div>

          <div className="grid gap-3">
            <StatCard
              label={isOwner ? 'Owner tools' : 'Diner tools'}
              value={isOwner ? 'Profile, replies, photos' : 'Browse, react, comment'}
            />
            <StatCard
              label="Next step"
              value={isOwner ? 'Open your dashboard' : 'Open discovery map'}
            />
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoTile
              icon={
                isOwner ? (
                  <RiUserSettingsLine className="size-4" />
                ) : (
                  <RiUserStarLine className="size-4" />
                )
              }
              title={isOwner ? 'Manage the brand' : 'Trusted opinions'}
              text={
                isOwner
                  ? 'Keep photos and details in sync.'
                  : 'Leave feedback that helps others choose.'
              }
            />
            <InfoTile
              icon={<RiUserAddLine className="size-4" />}
              title="Faster onboarding"
              text="One path for each role, without extra detours."
            />
            <InfoTile
              icon={
                isOwner ? (
                  <RiStore2Line className="size-4" />
                ) : (
                  <RiShieldUserLine className="size-4" />
                )
              }
              title={isOwner ? 'Owner portal' : 'Reviewer portal'}
              text={
                isOwner
                  ? 'Ready for restaurant owners.'
                  : 'Ready for diners and reviewers.'
              }
            />
          </div>
        </div>
      </aside>
    </main>
  );
}
