'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from 'ui-common';
import { RiStore2Line, RiUserLine, RiUserStarLine } from '@remixicon/react';

type Role = 'owner' | 'reviewer' | 'user';

const roles: Array<{
  id: Role;
  title: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: 'reviewer',
    title: 'Reviewer',
    description: 'Rate places, leave feedback, and help others choose.',
    icon: <RiUserStarLine className="size-4" />,
  },
  {
    id: 'user',
    title: 'Explorer',
    description: 'Discover restaurants and follow trusted reviews.',
    icon: <RiUserLine className="size-4" />,
  },
  {
    id: 'owner',
    title: 'Restaurant Owner',
    description: 'Manage your listing and monitor feedback from guests.',
    icon: <RiStore2Line className="size-4" />,
  },
];

export default function SignupPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role>('reviewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = useMemo(() => {
    if (selectedRole === 'owner') {
      return '/owner/dashboard';
    }

    return '/restaurants';
  }, [selectedRole]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    // UX scope only: backend auth endpoint will be wired in follow-up CRUD integration.
    router.push(destination);
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <Card className="w-full max-w-md border border-border/70">
          <CardHeader className="space-y-2">
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Pick a role to tailor your first destination after signup.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-xs font-medium text-foreground"
                >
                  Full name
                </label>
                <Input id="name" placeholder="Jane Doe" required />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-foreground"
                >
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-foreground"
                >
                  Password
                </label>
                <Input id="password" type="password" minLength={8} required />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Join as</p>
                <div className="grid gap-2">
                  {roles.map((role) => {
                    const selected = selectedRole === role.id;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        className={`rounded-md border p-3 text-left transition-colors ${
                          selected
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        }`}
                        onClick={() => setSelectedRole(role.id)}
                      >
                        <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium">
                          {role.icon}
                          {role.title}
                        </span>
                        <p className="text-xs">{role.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <aside className="hidden border-l border-border/60 bg-muted/20 lg:flex lg:items-center lg:justify-center">
        <div className="max-w-sm space-y-3 px-8">
          <h2 className="text-xl font-semibold tracking-tight">
            FlavorMap onboarding
          </h2>
          <p className="text-sm text-muted-foreground">
            Owners go to their dashboard right away. Reviewers and explorers
            land on the restaurant feed to start discovering and rating places.
          </p>
        </div>
      </aside>
    </main>
  );
}
