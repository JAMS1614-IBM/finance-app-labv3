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

/** Generic multi-line chart; a single entry gives a single-company chart. */
export function LineChartView({ lines, window }: { lines: ChartLine[]; window: TimeWindow }) {
  const times = [...new Set(lines.flatMap((l) => l.points.map((p) => p.time)))].sort();
  const data = times.map((time) => {
    const row: Record<string, string | number> = { time };
    for (const l of lines) {
      const hit = l.points.find((p) => p.time === time);
      if (hit) row[l.symbol] = hit.close;
    }
    return row;
  });

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tickFormatter={(t: string) => formatTick(t, window)} minTickGap={32} />
          <YAxis domain={['auto', 'auto']} width={48} />
          <Tooltip labelFormatter={(t: string) => formatTick(t, window)} />
          {lines.map((l) => (
            <Line key={l.symbol} dataKey={l.symbol} stroke={l.color} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
