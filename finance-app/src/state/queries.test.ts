import { describe, expect, it } from 'vitest';
import { NoDataError } from '../domain/errors';
import { shouldRetry } from './queries';

describe('shouldRetry', () => {
  it('retries a transient failure once', () => {
    expect(shouldRetry(0, new Error('network'))).toBe(true);
    expect(shouldRetry(1, new Error('network'))).toBe(false);
  });

  it('never retries when the symbol has no data', () => {
    expect(shouldRetry(0, new NoDataError('ZZZZ'))).toBe(false);
  });
});
