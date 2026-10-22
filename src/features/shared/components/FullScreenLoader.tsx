export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}