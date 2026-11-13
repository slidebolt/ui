import { describe, expect, it, vi } from 'vitest';
import { isStale } from './core';

describe('isStale', () => {
  it('does not guess when freshness data is absent', () => {
    expect(isStale(undefined)).toBeNull();
    expect(isStale({ health: 'healthy' })).toBeNull();
  });

  it('uses the provider-supplied stale interval', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:02:01Z'));
    expect(isStale({ health: 'healthy', observedAt: '2026-01-01T00:00:00Z', staleAfterSeconds: 120 })).toBe(true);
    vi.useRealTimers();
  });
});
