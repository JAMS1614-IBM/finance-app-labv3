/** Tiny in-memory TTL cache. Keeps repeat dashboard loads from hammering Yahoo. */
export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expires: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async getOrLoad(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key);
    if (hit && hit.expires > this.now()) return hit.value;
    const value = await load();
    this.store.set(key, { value, expires: this.now() + this.ttlMs });
    return value;
  }
}
