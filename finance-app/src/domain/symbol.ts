/** Ticker-like string: letters, digits and . ^ = - (e.g. IBM, BRK.B, ^GSPC, EURUSD=X). */
export const SYMBOL_RE = /^[A-Z0-9^][A-Z0-9.^=-]{0,11}$/;

/** Trims and uppercases user input. Does not validate. */
export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase();
}

/** True when the (already normalized) symbol is well-formed. */
export function isValidSymbol(symbol: string): boolean {
  return SYMBOL_RE.test(symbol);
}
