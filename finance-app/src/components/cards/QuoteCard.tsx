import type { Quote } from '../../domain/types';

export function QuoteCard({ quote, highlight }: { quote: Quote; highlight?: boolean }) {
  const up = quote.change >= 0;
  return (
    <article className={`card quote${highlight ? ' quote-highlight' : ''}`} aria-label={quote.symbol}>
      <div className="muted">
        {quote.symbol} · {quote.name}
      </div>
      <div className="quote-price">${quote.price.toFixed(2)}</div>
      <div className={up ? 'up' : 'down'}>
        {up ? '+' : ''}
        {quote.change.toFixed(2)} ({up ? '+' : ''}
        {quote.changePercent.toFixed(2)}%)
      </div>
    </article>
  );
}
