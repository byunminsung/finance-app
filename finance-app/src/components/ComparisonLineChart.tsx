import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { findCompany } from '../config/companies';
import { formatDateTime, formatPercent, formatTick } from '../lib/format';
import type { ChartRow } from '../lib/series';
import type { TimeWindow } from '../types/market';

interface ComparisonLineChartProps {
  rows: readonly ChartRow[];
  symbols: readonly string[];
  window: TimeWindow;
  height?: number;
}

/** Multi-line chart of % change since the start of the window. Presentational: no data fetching. */
export function ComparisonLineChart({ rows, symbols, window, height = 320 }: ComparisonLineChartProps) {
  return (
    <div role="img" aria-label={`Percent change comparison for ${symbols.join(', ')}`}>
      <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 800, height }}>
        <LineChart data={[...rows]} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value: number) => formatTick(value, window)}
            minTickGap={32}
          />
          <YAxis tickFormatter={(value: number) => `${value.toFixed(1)}%`} width={56} />
          <ReferenceLine y={0} stroke="#8d8d8d" />
          <Tooltip
            labelFormatter={(value) => formatDateTime(Number(value))}
            formatter={(value) => formatPercent(Number(value))}
          />
          <Legend />
          {symbols.map((symbol) => {
            const company = findCompany(symbol);
            return (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                name={company?.name ?? symbol}
                stroke={company?.color ?? '#525252'}
                strokeWidth={company?.isPrimary ? 3 : 1.75}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
