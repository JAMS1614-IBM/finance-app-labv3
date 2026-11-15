import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint, TimeWindow } from '../../domain/types';

export function formatTick(iso: string, window: TimeWindow): string {
  const d = new Date(iso);
  return window === 'day'
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export interface ChartLine {
  symbol: string;
  color: string;
  points: PricePoint[];
}

export type ChartRow = Record<string, string | number>;

/** Merges every line onto a shared, sorted time axis. Missing values are left out of the row. */
export function buildChartData(lines: ChartLine[]): ChartRow[] {
  const times = [...new Set(lines.flatMap((l) => l.points.map((p) => p.time)))].sort();
  return times.map((time) => {
    const row: ChartRow = { time };
    for (const l of lines) {
      const hit = l.points.find((p) => p.time === time);
      if (hit) row[l.symbol] = hit.close;
    }
    return row;
  });
}

/** Generic multi-line chart; a single entry gives a single-company chart. */
export function LineChartView({ lines, window }: { lines: ChartLine[]; window: TimeWindow }) {
  const data = buildChartData(lines);

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tickFormatter={(t: string) => formatTick(t, window)} minTickGap={32} />
          <YAxis domain={['auto', 'auto']} width={48} />
          <Tooltip labelFormatter={(t: string) => formatTick(t, window)} />
          {lines.map((l) => (
            // A function dataKey is required: a string like "BRK.B" would be read as a nested path.
            <Line
              key={l.symbol}
              name={l.symbol}
              dataKey={(row: ChartRow) => row[l.symbol]}
              stroke={l.color}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
