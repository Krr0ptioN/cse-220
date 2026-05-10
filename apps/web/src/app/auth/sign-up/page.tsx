import {
  AuthSignUpPage,
  authVariantFromRoleParam,
} from '@flavor-map/ui-module-auth';

type SignUpPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const variant = authVariantFromRoleParam(resolvedSearchParams?.role);

  return <AuthSignUpPage variant={variant} />;
}
