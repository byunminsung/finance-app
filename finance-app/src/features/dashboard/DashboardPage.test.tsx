import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { MarketServiceError } from '../../lib/errors';
import { createFixtureMarketService } from '../../services/marketData/fixtureService';
import type { MarketDataService } from '../../types/market';

// Recharts' ResponsiveContainer needs layout, which jsdom does not provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const NOW = Date.UTC(2026, 10, 24, 15, 0, 0);
const fixture = () => createFixtureMarketService({ now: () => NOW });

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DashboardPage', () => {
  it('renders quotes for IBM and competitors, the default window, and the source label', async () => {
    render(<App service={fixture()} />);

    expect(screen.getByRole('heading', { name: 'Market Dashboard' })).toBeInTheDocument();
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);

    const quotes = await screen.findByRole('list');
    await waitFor(() => expect(within(quotes).getAllByRole('listitem')).toHaveLength(5));
    for (const symbol of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) {
      expect(within(quotes).getByText(symbol, { selector: '.summary-card__symbol' })).toBeInTheDocument();
    }
    expect(screen.getByText(/Sample data/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('switches time windows and keeps the choice in the URL', async () => {
    const user = userEvent.setup();
    render(<App service={fixture()} />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Last quarter' }));
    expect(screen.getByRole('button', { name: 'Last quarter' })).toHaveAttribute('aria-pressed', 'true');
    expect(window.location.search).toBe('?window=quarter');
    expect(await screen.findByText(/Last quarter: performance/)).toBeInTheDocument();
    expect(await screen.findByRole('table')).toHaveTextContent('Return ranking: Last quarter');

    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(window.location.search).toBe('');
  });

  it('restores the window from the URL and ignores unknown values', async () => {
    window.history.replaceState(null, '', '/?window=week');
    const { unmount } = render(<App service={fixture()} />);
    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
    await screen.findByRole('table');
    unmount();

    window.history.replaceState(null, '', '/?window=bogus');
    render(<App service={fixture()} />);
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'true');
    await screen.findByRole('table');
  });

  it('shows a generic error with retry when the whole request fails, then recovers', async () => {
    const user = userEvent.setup();
    const base = fixture();
    let failing = true;
    const flaky: MarketDataService = {
      ...base,
      getQuotes: async (symbols, signal) => {
        if (failing) throw new MarketServiceError('UPSTREAM_UNAVAILABLE');
        return base.getQuotes(symbols, signal);
      },
    };
    render(<App service={flaky} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The market data source is unavailable.');
    expect(alert.textContent).not.toMatch(/Error:|at \w+/);

    failing = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByText('IBM', { selector: '.summary-card__symbol' })).toBeInTheDocument();
  });

  it('shows partial failures for one symbol while the rest still render', async () => {
    const base = fixture();
    const partial: MarketDataService = {
      ...base,
      getQuotes: async (symbols, signal) => {
        const results = await base.getQuotes(symbols, signal);
        return results.map((r) => (r.symbol === 'SAP' ? { symbol: 'SAP', ok: false as const, error: 'RATE_LIMITED' as const } : r));
      },
    };
    render(<App service={partial} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Too many requests');
    expect(await screen.findByText('IBM', { selector: '.summary-card__symbol' })).toBeInTheDocument();
    expect(screen.getByText('MSFT', { selector: '.summary-card__symbol' })).toBeInTheDocument();
  });

  it('shows an empty state when the service returns no price points', async () => {
    const base = fixture();
    const empty: MarketDataService = {
      ...base,
      getHistory: async (symbols, window) =>
        symbols.map((symbol) => ({ symbol, ok: true as const, data: { symbol, window, points: [] } })),
    };
    render(<App service={empty} />);
    expect(await screen.findByText('No price data is available for this period.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
