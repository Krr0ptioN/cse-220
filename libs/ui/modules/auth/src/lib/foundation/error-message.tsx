export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </p>
  );
}
