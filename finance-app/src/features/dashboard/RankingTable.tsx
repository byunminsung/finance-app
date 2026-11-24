import { findCompany } from '../../config/companies';
import { formatPercent } from '../../lib/format';
import type { RankedReturn } from '../../lib/series';

interface RankingTableProps {
  ranking: readonly RankedReturn[];
  windowLabel: string;
}

export function RankingTable({ ranking, windowLabel }: RankingTableProps) {
  return (
    <table className="ranking">
      <caption>Return ranking: {windowLabel}</caption>
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">Company</th>
          <th scope="col">Return</th>
        </tr>
      </thead>
      <tbody>
        {ranking.map((entry) => (
          <tr key={entry.symbol}>
            <td>{entry.rank}</td>
            <td>
              {findCompany(entry.symbol)?.name ?? entry.symbol} ({entry.symbol})
            </td>
            <td className={entry.returnPercent >= 0 ? 'positive' : 'negative'}>{formatPercent(entry.returnPercent)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
