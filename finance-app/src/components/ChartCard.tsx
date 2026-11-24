import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Optional right-aligned slot (e.g. a badge or action). */
  actions?: ReactNode;
  children: ReactNode;
}

/** Reusable card frame. Chart content and its loading/error states are passed as children. */
export function ChartCard({ title, subtitle, actions, children }: ChartCardProps) {
  return (
    <section className="chart-card" aria-label={title}>
      <header className="chart-card__header">
        <div>
          <h2 className="chart-card__title">{title}</h2>
          {subtitle ? <p className="chart-card__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="chart-card__actions">{actions}</div> : null}
      </header>
      <div className="chart-card__body">{children}</div>
    </section>
  );
}
