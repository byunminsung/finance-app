interface StateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading market data…' }: StateProps) {
  return (
    <div className="state state--loading" role="status">
      {message}
    </div>
  );
}

export function EmptyState({ message = 'No data to display.' }: StateProps) {
  return <div className="state state--empty">{message}</div>;
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="state state--error" role="alert">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
