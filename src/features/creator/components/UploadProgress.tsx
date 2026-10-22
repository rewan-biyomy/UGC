export function UploadProgress({ progress }: { progress: number }) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  return (
    <div className="mt-4" role="status" aria-live="polite">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Uploading media</span><span>{safeProgress}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-brand-100">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-500 transition-all" style={{ width: `${safeProgress}%` }} />
      </div>
    </div>
  );
}