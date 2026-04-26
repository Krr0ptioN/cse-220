'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from 'ui-common';
import { RiArrowRightLine, RiRestaurantLine, RiUserStarLine } from '@remixicon/react';

import { registerUser } from '../_lib/auth-api';
import {
  buildRegisterPayload,
  destinationForRole,
  usernameFromEmail,
  type AuthVariant,
} from '../_lib/auth-flow';
import { EmailField, PasswordField } from './auth-fields';

type SignUpProps = {
  variant: AuthVariant;
};

export function SignUp({ variant }: SignUpProps) {
  const router = useRouter();
  const isBusiness = variant === 'business';
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await registerUser(
        buildRegisterPayload({
          email,
          password,
          displayName,
          username,
          variant,
        }),
      );
      startTransition(() => router.push(destinationForRole(user.role)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <Card className="w-full max-w-md border border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <Badge variant={isBusiness ? 'secondary' : 'outline'}>
              {isBusiness ? 'Business onboarding' : 'Reviewer onboarding'}
            </Badge>
            <CardTitle className="text-2xl">
              {isBusiness ? 'Create your restaurant account' : 'Create your reviewer account'}
            </CardTitle>
            <CardDescription>
              {isBusiness
                ? 'Start with your account, then create the first listing from your dashboard.'
                : 'Join FlavorMap to discover restaurants and leave useful reviews.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="display-name" className="text-xs font-medium text-foreground">
                  {isBusiness ? 'Business display name' : 'Display name'}
                </label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={isBusiness ? 'Ada Bistro' : 'Jane Foodie'}
                  required
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>

              <EmailField
                value={email}
                onChange={setEmail}
                disabled={isSubmitting}
                autoFocus
              />

              <div className="space-y-2">
                <label htmlFor="username" className="text-xs font-medium text-foreground">
                  Username
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={email ? usernameFromEmail(email) : 'flavormap-user'}
                  disabled={isSubmitting}
                  autoComplete="username"
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  Leave blank to use the suggestion from your email.
                </p>
              </div>

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                disabled={isSubmitting}
                autoComplete="new-password"
                minLength={8}
              />
              <PasswordField
                id="confirm-password"
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                disabled={isSubmitting}
                autoComplete="new-password"
                minLength={8}
              />

              {error && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col items-start gap-3 border-t border-border/60 px-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link
                href={isBusiness ? '/business/signin' : '/auth/signin'}
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <Link
              href={isBusiness ? '/auth/signup' : '/business/signup'}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {isBusiness ? 'Create a reviewer account' : 'Register a restaurant business'}
              <RiArrowRightLine className="size-3" aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>
      </section>

      <aside className="hidden border-l border-border/60 bg-muted/20 lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md space-y-5 px-10">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isBusiness ? (
              <RiRestaurantLine className="size-6" aria-hidden="true" />
            ) : (
              <RiUserStarLine className="size-6" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isBusiness ? 'Self-service setup for owners' : 'A better local discovery loop'}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {isBusiness
                ? 'Create an owner account, add your restaurant, and keep the essential public details accurate without waiting on support.'
                : 'Reviewer accounts go straight to restaurant discovery so you can browse, compare, and contribute quickly.'}
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
