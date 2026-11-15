import { describe, expect, it } from 'vitest';
import { NoDataError } from './errors';
import { isValidSymbol, normalizeSymbol } from './symbol';

describe('normalizeSymbol', () => {
  it('trims and uppercases', () => {
    expect(normalizeSymbol('  msft ')).toBe('MSFT');
  });
});

describe('isValidSymbol', () => {
  // Well-formed is not the same as known: BRK.B passes validation but Yahoo has no such symbol,
  // so it surfaces as "no data". Yahoo's own forms are BRK-B and VOD.L.
  it.each(['IBM', 'MSFT', 'BRK-B', 'BRK.B', 'VOD.L', '^GSPC', 'EURUSD=X', 'A'])('accepts %s', (s) => {
    expect(isValidSymbol(s)).toBe(true);
  });

  it.each(['', ' ', '$$$', 'IBM MSFT', 'ibm', '.IBM', 'WAYTOOLONGSYMBOL1', '<script>'])('rejects %j', (s) => {
    expect(isValidSymbol(s)).toBe(false);
  });
});

describe('NoDataError', () => {
  it('carries the symbol and a readable message', () => {
    const e = new NoDataError('ZZZZ');
    expect(e).toBeInstanceOf(Error);
    expect(e.symbol).toBe('ZZZZ');
    expect(e.message).toBe('No price history found for ZZZZ');
  });
});
