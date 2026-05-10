import { SignUpForm } from '../forms/sign-up';

export function ReviewerSignUp() {
  return (
    <SignUpForm
      variant="reviewer"
      badge="Reviewer onboarding"
      title="Create your reviewer account"
      description="Join FlavorMap to discover restaurants and leave useful reviews."
      displayNameLabel="Display name"
      displayNamePlaceholder="Jane Foodie"
    />
  );
}
