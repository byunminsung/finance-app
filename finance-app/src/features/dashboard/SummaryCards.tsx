import { findCompany } from '../../config/companies';
import { describeError } from '../../lib/errors';
import { formatPercent, formatPrice, formatSigned } from '../../lib/format';
import type { Quote, SymbolResult } from '../../types/market';

interface SummaryCardsProps {
  results: readonly SymbolResult<Quote>[];
}

/** One card per company: current price and day change. A failed symbol shows its own error only. */
export function SummaryCards({ results }: SummaryCardsProps) {
  return (
    <ul className="summary-cards">
      {results.map((result) => {
        const company = findCompany(result.symbol);
        const name = company?.name ?? result.symbol;
        if (!result.ok) {
          return (
            <li key={result.symbol} className="summary-card summary-card--error">
              <span className="summary-card__symbol">{result.symbol}</span>
              <span className="summary-card__name">{name}</span>
              <span role="alert">{describeError(result.error)}</span>
            </li>
          );
        }
        const { price, change, changePercent, currency } = result.data;
        const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
        return (
          <li key={result.symbol} className={`summary-card summary-card--${direction}`}>
            <span className="summary-card__symbol">{result.symbol}</span>
            <span className="summary-card__name">{name}</span>
            <span className="summary-card__price">{formatPrice(price, currency)}</span>
            <span className="summary-card__change">
              {formatSigned(change)} ({formatPercent(changePercent)})
            </span>
          </li>
        );
      })}
    </ul>
  );
}
