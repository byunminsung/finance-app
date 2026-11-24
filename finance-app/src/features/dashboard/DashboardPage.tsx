import { ChartCard } from '../../components/ChartCard';
import { ErrorState, LoadingState } from '../../components/StateViews';
import { COMPANY_SYMBOLS } from '../../config/companies';
import { useQuotes } from '../../hooks/useMarketData';
import { useTimeWindow } from '../../hooks/useTimeWindow';
import { describeError } from '../../lib/errors';
import { useMarketService } from '../../services/marketData/MarketServiceContext';
import { SummaryCards } from './SummaryCards';
import { WindowTabs } from './WindowTabs';
import { WindowView } from './WindowView';

/** Page composition only: layout, window selection, and the quotes strip. */
export function DashboardPage() {
  const [window, setWindow] = useTimeWindow();
  const service = useMarketService();
  const quotes = useQuotes(COMPANY_SYMBOLS);

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>Market Dashboard</h1>
          <p className="dashboard__source">Data source: {service.sourceLabel}</p>
        </div>
        <WindowTabs value={window} onChange={setWindow} />
      </header>

      <ChartCard title="Current quotes" subtitle="IBM and competitors">
        {quotes.status === 'loading' ? <LoadingState /> : null}
        {quotes.status === 'error' ? <ErrorState message={describeError(quotes.error)} onRetry={quotes.reload} /> : null}
        {quotes.status === 'success' ? <SummaryCards results={quotes.data} /> : null}
      </ChartCard>

      <WindowView key={window} window={window} />

      <footer className="dashboard__footer">For demonstration only. Not investment advice.</footer>
    </main>
  );
}
