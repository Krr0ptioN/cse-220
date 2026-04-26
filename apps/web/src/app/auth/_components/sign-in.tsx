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
} from 'ui-common';
import { RiArrowRightLine, RiShieldUserLine, RiStore2Line } from '@remixicon/react';

import { loginUser } from '../_lib/auth-api';
import { destinationForRole, type AuthVariant } from '../_lib/auth-flow';
import { EmailField, PasswordField } from './auth-fields';

type SignInProps = {
  variant: AuthVariant;
};

export function SignIn({ variant }: SignInProps) {
  const router = useRouter();
  const isBusiness = variant === 'business';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const user = await loginUser({ email, password });
      startTransition(() => router.push(destinationForRole(user.role)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <Card className="w-full max-w-md border border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <Badge variant={isBusiness ? 'secondary' : 'outline'}>
              {isBusiness ? 'Business portal' : 'Reviewer access'}
            </Badge>
            <CardTitle className="text-2xl">
              {isBusiness ? 'Sign in to manage your restaurant' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isBusiness
                ? 'Update your listing, monitor ratings, and keep your profile current.'
                : 'Continue discovering restaurants and sharing trusted reviews.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <EmailField
                value={email}
                onChange={setEmail}
                disabled={isSubmitting}
                autoFocus
              />
              <PasswordField
                value={password}
                onChange={setPassword}
                disabled={isSubmitting}
              />

              {error && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col items-start gap-3 border-t border-border/60 px-4 pt-4">
            <p className="text-xs text-muted-foreground">
              {isBusiness ? 'Need a business account?' : "Don't have an account?"}{' '}
              <Link
                href={isBusiness ? '/business/signup' : '/auth/signup'}
                className="text-primary underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
            <Link
              href={isBusiness ? '/auth/signin' : '/business/signin'}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {isBusiness ? 'Sign in as a reviewer' : 'Restaurant business sign in'}
              <RiArrowRightLine className="size-3" aria-hidden="true" />
            </Link>
          </CardFooter>
        </Card>
      </section>

      <aside className="hidden border-l border-border/60 bg-muted/20 lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md space-y-5 px-10">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isBusiness ? (
              <RiStore2Line className="size-6" aria-hidden="true" />
            ) : (
              <RiShieldUserLine className="size-6" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isBusiness ? 'A cleaner way to manage your listing' : 'Reviews that help people decide'}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {isBusiness
                ? 'FlavorMap keeps the manager workflow focused: core details, ratings, and the next steps your guests see first.'
                : 'Find restaurants, compare details, and add feedback that makes the next visit easier for everyone.'}
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
