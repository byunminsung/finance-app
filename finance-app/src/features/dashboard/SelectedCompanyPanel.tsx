import { lazy, Suspense, useMemo } from 'react';
import { ChartCard } from '../../components/ChartCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { findListedCompany } from '../../config/catalog';
import { useHistory } from '../../hooks/useMarketData';
import { useSelectedCompany } from '../../hooks/useSelectedCompany';
import { describeError } from '../../lib/errors';
import { cleanPoints, toChartRows } from '../../lib/series';
import { getWindowLabel } from '../../lib/timeWindows';
import type { MarketErrorCode, TimeWindow } from '../../types/market';
import { CompanyForm } from './CompanyForm';

const ComparisonLineChart = lazy(() =>
  import('../../components/ComparisonLineChart').then((module) => ({ default: module.ComparisonLineChart })),
);

const REFERENCE_SYMBOL = 'IBM';

/** Error codes that mean "this symbol has nothing to show", as opposed to a transient failure. */
const NO_DATA_CODES: readonly MarketErrorCode[] = ['NO_DATA', 'NOT_FOUND'];

interface SelectedCompanyPanelProps {
  window: TimeWindow;
}

/**
 * Lets the user chart one company against IBM for the active window.
 * Fully separate from WindowView: its own request, its own states, never feeds the main dashboard.
 */
export function SelectedCompanyPanel({ window }: SelectedCompanyPanelProps) {
  const [selected, setSelected] = useSelectedCompany();
  const label = getWindowLabel(window);

  return (
    <ChartCard
      title="Look up a company"
      subtitle={selected ? `${selected} vs. ${REFERENCE_SYMBOL} · ${label} · % change` : 'Chart any listed company against IBM'}
    >
      <CompanyForm selected={selected} onSubmit={setSelected} onClear={() => setSelected(null)} />
      {selected ? <SelectedCompanyChart key={`${selected}:${window}`} symbol={selected} window={window} /> : null}
    </ChartCard>
  );
}

function SelectedCompanyChart({ symbol, window }: { symbol: string; window: TimeWindow }) {
  // IBM is the baseline; when IBM itself is selected, chart it alone.
  const symbols = useMemo(() => (symbol === REFERENCE_SYMBOL ? [symbol] : [REFERENCE_SYMBOL, symbol]), [symbol]);
  const state = useHistory(symbols, window);
  const name = findListedCompany(symbol)?.name ?? symbol;

  if (state.status === 'loading') return <LoadingState message={`Loading ${symbol}…`} />;
  if (state.status === 'error') return <ErrorState message={describeError(state.error)} onRetry={state.reload} />;

  // Look the selected symbol up by name, never by position, so another company's data can't stand in for it.
  const selectedResult = state.data.find((result) => result.symbol === symbol);
  if (!selectedResult) return <EmptyState message={`No data is available for ${symbol}.`} />;
  if (!selectedResult.ok) {
    if (NO_DATA_CODES.includes(selectedResult.error)) {
      return (
        <p className="state state--empty" data-testid="no-data">
          No data available for {symbol}. It may not be a supported ticker, or it has no price history for this period.
        </p>
      );
    }
    return <ErrorState message={`${symbol}: ${describeError(selectedResult.error)}`} onRetry={state.reload} />;
  }

  const selectedSeries = selectedResult.data;
  if (cleanPoints(selectedSeries.points).length < 2) {
    return (
      <p className="state state--empty" data-testid="no-data">
        No price data is available for {symbol} in this period.
      </p>
    );
  }

  // Only the selected company's series, plus IBM as a baseline when IBM itself returned usable data.
  const reference = symbol === REFERENCE_SYMBOL ? undefined : state.data.find((result) => result.symbol === REFERENCE_SYMBOL);
  const referenceSeries = reference?.ok && cleanPoints(reference.data.points).length >= 2 ? reference.data : undefined;
  const series = referenceSeries ? [referenceSeries, selectedSeries] : [selectedSeries];

  return (
    <>
      {symbol !== REFERENCE_SYMBOL && !referenceSeries ? (
        <p className="state state--empty">IBM baseline unavailable; showing {name} only.</p>
      ) : null}
      <Suspense fallback={<LoadingState message="Loading chart…" />}>
        <ComparisonLineChart
          rows={toChartRows(series)}
          symbols={series.map((entry) => entry.symbol)}
          window={window}
        />
      </Suspense>
    </>
  );
}
