import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { MarketServiceError } from '../../lib/errors';
import { createFixtureMarketService } from '../../services/marketData/fixtureService';
import type { MarketDataService, PriceSeries, SymbolResult } from '../../types/market';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const NOW = Date.UTC(2026, 10, 24, 15, 0, 0);
const fixture = () => createFixtureMarketService({ now: () => NOW });

/** Wraps a service and records every getHistory call so tests can assert what was (not) requested. */
function spyOn(base: MarketDataService, override?: MarketDataService['getHistory']) {
  const calls: { symbols: string[]; window: string }[] = [];
  const service: MarketDataService = {
    ...base,
    getHistory: (symbols, window, signal) => {
      calls.push({ symbols: [...symbols], window });
      return (override ?? base.getHistory)(symbols, window, signal);
    },
  };
  return { service, calls };
}

const panel = () => screen.getByRole('region', { name: 'Look up a company' });
const input = () => screen.getByLabelText('Company ticker');

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SelectedCompanyPanel', () => {
  it('is idle by default: form only, no chart and no extra data request', async () => {
    const { service, calls } = spyOn(fixture());
    render(<App service={service} />);
    await screen.findByRole('table');

    expect(within(panel()).getByRole('button', { name: 'Show chart' })).toBeInTheDocument();
    expect(within(panel()).queryByRole('img')).not.toBeInTheDocument();
    expect(calls.every((call) => call.symbols.length === 5)).toBe(true);
  });

  it('charts a symbol outside the tracked companies against IBM', async () => {
    const user = userEvent.setup();
    const { service, calls } = spyOn(fixture());
    render(<App service={service} />);
    await screen.findByRole('table');

    await user.type(input(), 'nvda');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));

    expect(await within(panel()).findByRole('img', { name: /IBM, NVDA/ })).toBeInTheDocument();
    expect(calls.some((call) => call.symbols.join() === 'IBM,NVDA' && call.window === 'day')).toBe(true);
    expect(window.location.search).toBe('?company=NVDA');
  });

  it('charts IBM alone when IBM is selected', async () => {
    const user = userEvent.setup();
    const { service, calls } = spyOn(fixture());
    render(<App service={service} />);
    await screen.findByRole('table');

    await user.type(input(), 'IBM');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));

    expect(await within(panel()).findByRole('img', { name: /for IBM$/ })).toBeInTheDocument();
    expect(calls.some((call) => call.symbols.join() === 'IBM')).toBe(true);
  });

  it('rejects a malformed symbol locally and makes no data request', async () => {
    const user = userEvent.setup();
    const { service, calls } = spyOn(fixture());
    render(<App service={service} />);
    await screen.findByRole('table');
    const before = calls.length;

    await user.type(input(), 'ibm;x');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));

    expect(within(panel()).getByRole('alert')).toHaveTextContent('That ticker symbol is not valid.');
    expect(calls).toHaveLength(before);
    expect(window.location.search).toBe('');
  });

  it('rejects an empty submission', async () => {
    const user = userEvent.setup();
    render(<App service={fixture()} />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Show chart' }));
    expect(within(panel()).getByRole('alert')).toHaveTextContent('not valid');
  });

  it('shows a clear no-data message for an unsupported symbol and never charts another company', async () => {
    const user = userEvent.setup();
    render(<App service={fixture()} />);
    await screen.findByRole('table');

    await user.type(input(), 'ZZZZ');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));

    const message = await within(panel()).findByTestId('no-data');
    expect(message).toHaveTextContent('No data available for ZZZZ');
    expect(within(panel()).queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not substitute IBM data when the selected symbol has no usable data', async () => {
    const user = userEvent.setup();
    const base = fixture();
    // Service answers the selected symbol with an empty series but still returns real IBM data.
    const { service } = spyOn(base, async (symbols, window, signal) => {
      const real = await base.getHistory(symbols, window, signal);
      return real.map((result): SymbolResult<PriceSeries> =>
        result.symbol === 'NVDA' ? { symbol: 'NVDA', ok: true, data: { symbol: 'NVDA', window, points: [] } } : result,
      );
    });
    render(<App service={service} />);
    await screen.findByRole('table');

    await user.type(input(), 'NVDA');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));

    expect(await within(panel()).findByTestId('no-data')).toHaveTextContent('No price data is available for NVDA');
    expect(within(panel()).queryByRole('img')).not.toBeInTheDocument();
  });

  it('matches results by symbol, not position, when the service reorders them', async () => {
    const user = userEvent.setup();
    const base = fixture();
    const { service } = spyOn(base, async (symbols, window, signal) => (await base.getHistory(symbols, window, signal)).reverse());
    render(<App service={service} />);
    await screen.findByRole('table');

    await user.type(input(), 'AAPL');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));

    expect(await within(panel()).findByRole('img', { name: /IBM, AAPL/ })).toBeInTheDocument();
  });

  it('shows a loading state, then a scoped error with retry that recovers', async () => {
    const user = userEvent.setup();
    const base = fixture();
    let failing = true;
    const { service } = spyOn(base, async (symbols, window, signal) => {
      // Only the lookup request (not the five-company dashboard request) fails.
      if (failing && symbols.length === 2) throw new MarketServiceError('UPSTREAM_UNAVAILABLE');
      return base.getHistory(symbols, window, signal);
    });
    render(<App service={service} />);
    await screen.findByRole('table');

    await user.type(input(), 'AMZN');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));

    const alert = await within(panel()).findByRole('alert');
    expect(alert).toHaveTextContent('The market data source is unavailable.');
    expect(screen.getByRole('table')).toBeInTheDocument(); // main dashboard unaffected

    failing = false;
    await user.click(within(panel()).getByRole('button', { name: 'Retry' }));
    expect(await within(panel()).findByRole('img', { name: /IBM, AMZN/ })).toBeInTheDocument();
  });

  it('refetches for the new window when the tab changes', async () => {
    const user = userEvent.setup();
    const { service, calls } = spyOn(fixture());
    render(<App service={service} />);
    await screen.findByRole('table');

    await user.type(input(), 'AAPL');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));
    await within(panel()).findByRole('img');
    await user.click(screen.getByRole('button', { name: 'Last quarter' }));

    await waitFor(() => expect(calls.some((c) => c.symbols.join() === 'IBM,AAPL' && c.window === 'quarter')).toBe(true));
    expect(await within(panel()).findByRole('img', { name: /IBM, AAPL/ })).toBeInTheDocument();
  });

  it('restores the selection from the URL and drops unsafe values', async () => {
    window.history.replaceState(null, '', '/?company=nvda');
    const { unmount } = render(<App service={fixture()} />);
    expect(await within(panel()).findByRole('img', { name: /IBM, NVDA/ })).toBeInTheDocument();
    unmount();

    window.history.replaceState(null, '', '/?company=%3Cscript%3E');
    render(<App service={fixture()} />);
    await screen.findByRole('table');
    expect(within(panel()).queryByRole('img')).not.toBeInTheDocument();
    expect(input()).toHaveValue('');
  });

  it('clears the selection and removes it from the URL', async () => {
    const user = userEvent.setup();
    render(<App service={fixture()} />);
    await screen.findByRole('table');

    await user.type(input(), 'AAPL');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));
    await within(panel()).findByRole('img');

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(within(panel()).queryByRole('img')).not.toBeInTheDocument();
    expect(window.location.search).toBe('');
  });

  it('leaves the existing IBM-vs-competitors sections and their requests unchanged', async () => {
    const user = userEvent.setup();
    const { service, calls } = spyOn(fixture());
    render(<App service={service} />);
    const table = await screen.findByRole('table');
    const rankingBefore = table.textContent;
    const mainCalls = calls.filter((c) => c.symbols.length === 5).length;

    await user.type(input(), 'NVDA');
    await user.click(screen.getByRole('button', { name: 'Show chart' }));
    await within(panel()).findByRole('img');

    expect(screen.getByRole('table').textContent).toBe(rankingBefore);
    expect(calls.filter((c) => c.symbols.length === 5)).toHaveLength(mainCalls);
    expect(within(screen.getByRole('region', { name: 'Current quotes' })).getAllByRole('listitem')).toHaveLength(5);
  });
});
