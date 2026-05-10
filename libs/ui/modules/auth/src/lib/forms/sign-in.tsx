'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, startTransition, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'ui-common';

import { EmailField, PasswordField } from '../fields';
import { ErrorMessage } from '../foundation';
import { destinationForSessionRole, useAuthSession } from '../session-store';

interface SignInFormProps {
  title: ReactNode;
  description: ReactNode;
}

export function SignInForm({ title, description }: SignInFormProps) {
  const router = useRouter();
  const signIn = useAuthSession((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const user = await signIn({ email, password });
      startTransition(() => router.push(destinationForSessionRole(user.role)));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border border-border/70 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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

          {error && <ErrorMessage message={error} />}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col items-start gap-3 border-t border-border/60 px-4 pt-4">
        <p className="text-xs text-muted-foreground">
          Need an account?{' '}
          <Link
            href="/auth/sign-up"
            className="text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
