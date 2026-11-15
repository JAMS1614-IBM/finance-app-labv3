/**
 * Thrown by a provider when a well-formed symbol has no market data.
 * The UI shows this as "no data", and never retries or substitutes another company.
 */
export class NoDataError extends Error {
  readonly symbol: string;

  constructor(symbol: string) {
    super(`No price history found for ${symbol}`);
    this.name = 'NoDataError';
    this.symbol = symbol;
  }
}
