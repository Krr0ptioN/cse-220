import { SignUpForm } from '../forms/sign-up';

export function OwnerSignUp() {
  return (
    <SignUpForm
      variant="owner"
      badge="Owner onboarding"
      title="Create your restaurant account"
      description="Start with your account, then create the first listing from your dashboard."
      displayNameLabel="Restaurant display name"
      displayNamePlaceholder="Ada Bistro"
    />
  );
}
