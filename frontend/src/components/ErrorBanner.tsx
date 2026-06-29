interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/** Dismissible banner for surfacing API/network errors at the top of the app. */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="font-medium text-red-500 transition hover:text-red-700"
      >
        ✕
      </button>
    </div>
  );
}
