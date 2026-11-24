import { lazy, Suspense, useMemo } from 'react';
import { ChartCard } from '../../components/ChartCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { COMPANY_SYMBOLS, findCompany } from '../../config/companies';
import { useHistory } from '../../hooks/useMarketData';
import { describeError } from '../../lib/errors';
import { rankByReturn, toChartRows } from '../../lib/series';
import { getWindowLabel, TIME_WINDOWS } from '../../lib/timeWindows';
import type { PriceSeries, TimeWindow } from '../../types/market';
import { RankingTable } from './RankingTable';

// Recharts is the largest dependency; load it on demand to keep the initial bundle small.
const ComparisonLineChart = lazy(() =>
  import('../../components/ComparisonLineChart').then((module) => ({ default: module.ComparisonLineChart })),
);

interface WindowViewProps {
  window: TimeWindow;
}

/** Comparison chart and ranking for one time window. Fetches via hooks; renders via presentational parts. */
export function WindowView({ window }: WindowViewProps) {
  const state = useHistory(COMPANY_SYMBOLS, window);
  const config = TIME_WINDOWS.find((entry) => entry.id === window);
  const label = getWindowLabel(window);

  const derived = useMemo(() => {
    if (state.status !== 'success') return null;
    const series: PriceSeries[] = [];
    const failures: { symbol: string; message: string }[] = [];
    for (const result of state.data) {
      if (result.ok) series.push(result.data);
      else failures.push({ symbol: result.symbol, message: describeError(result.error) });
    }
    return { series, failures, rows: toChartRows(series), ranking: rankByReturn(series) };
  }, [state]);

  return (
    <>
      <ChartCard title={`${label}: performance vs. start of period`} subtitle={`${config?.description ?? ''} · % change`}>
        {state.status === 'loading' ? <LoadingState /> : null}
        {state.status === 'error' ? <ErrorState message={describeError(state.error)} onRetry={state.reload} /> : null}
        {derived ? (
          <>
            {derived.failures.length > 0 ? (
              <ul className="partial-failures" role="alert">
                {derived.failures.map((failure) => (
                  <li key={failure.symbol}>
                    {findCompany(failure.symbol)?.name ?? failure.symbol}: {failure.message}
                  </li>
                ))}
              </ul>
            ) : null}
            {derived.rows.length === 0 ? (
              <EmptyState message="No price data is available for this period." />
            ) : (
              <Suspense fallback={<LoadingState message="Loading chart…" />}>
                <ComparisonLineChart rows={derived.rows} symbols={derived.series.map((s) => s.symbol)} window={window} />
              </Suspense>
            )}
          </>
        ) : null}
      </ChartCard>

      {derived && derived.ranking.length > 0 ? (
        <ChartCard title="Ranking" subtitle="Best to worst performer">
          <RankingTable ranking={derived.ranking} windowLabel={label} />
        </ChartCard>
      ) : null}
    </>
  );
}
