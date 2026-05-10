'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useState, type FormEvent, type ReactNode } from 'react';
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

import { type AuthVariant, usernameFromEmail } from '../flow';
import { EmailField, PasswordField } from '../fields';
import { ErrorMessage } from '../foundation';
import { destinationForSessionRole, useAuthSession } from '../session-store';

interface SignUpFormProps {
  variant: AuthVariant;
  badge: ReactNode;
  title: ReactNode;
  description: ReactNode;
  displayNameLabel: string;
  displayNamePlaceholder: string;
}

export function SignUpForm({
  variant,
  badge,
  title,
  description,
  displayNameLabel,
  displayNamePlaceholder,
}: SignUpFormProps) {
  const router = useRouter();
  const signUp = useAuthSession((state) => state.signUp);
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
      const user = await signUp({
        email,
        password,
        displayName,
        username,
        variant,
      });
      startTransition(() => router.push(destinationForSessionRole(user.role)));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border border-border/70 shadow-sm">
      <CardHeader className="space-y-2">
        <Badge variant={variant === 'owner' ? 'secondary' : 'outline'}>
          {badge}
        </Badge>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-muted/30 p-2">
          <Button
            asChild
            variant={variant === 'reviewer' ? 'default' : 'secondary'}
            size="sm"
            className="w-full"
          >
            <Link href="/auth/sign-up?role=reviewer">Reviewer</Link>
          </Button>
          <Button
            asChild
            variant={variant === 'owner' ? 'default' : 'secondary'}
            size="sm"
            className="w-full"
          >
            <Link href="/auth/sign-up?role=owner">Owner</Link>
          </Button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="display-name" className="text-xs font-medium text-foreground">
              {displayNameLabel}
            </label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={displayNamePlaceholder}
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

          {error && <ErrorMessage message={error} />}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col items-start gap-3 border-t border-border/60 px-4 pt-4">
        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/sign-in"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
