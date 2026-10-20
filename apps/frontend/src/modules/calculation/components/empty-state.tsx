interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
