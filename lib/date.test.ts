import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatExpiryLabel, getExpiryStatus } from './date';

describe('getExpiryStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T00:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "none" when there is no expiry date', () => {
    expect(getExpiryStatus(null)).toBe('none');
  });

  it('returns "expired" for a date in the past', () => {
    expect(getExpiryStatus('2026-07-20')).toBe('expired');
  });

  it('returns "soon" for a date within the threshold', () => {
    expect(getExpiryStatus('2026-07-24')).toBe('soon');
    expect(getExpiryStatus('2026-07-26')).toBe('soon');
  });

  it('returns "ok" for a date beyond the threshold', () => {
    expect(getExpiryStatus('2026-07-30')).toBe('ok');
  });

  it('respects a custom threshold', () => {
    expect(getExpiryStatus('2026-07-25', 1)).toBe('ok');
    expect(getExpiryStatus('2026-07-24', 1)).toBe('soon');
  });
});

describe('formatExpiryLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T00:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('labels missing expiry dates', () => {
    expect(formatExpiryLabel(null)).toBe('期限なし');
  });

  it('labels today and tomorrow specially', () => {
    expect(formatExpiryLabel('2026-07-23')).toBe('今日まで');
    expect(formatExpiryLabel('2026-07-24')).toBe('明日まで');
  });

  it('counts days remaining', () => {
    expect(formatExpiryLabel('2026-07-28')).toBe('あと5日');
  });

  it('counts days since expiring', () => {
    expect(formatExpiryLabel('2026-07-20')).toBe('3日前に期限切れ');
  });
});
