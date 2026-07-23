import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpiryBadge } from './expiry-badge';

describe('ExpiryBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T00:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "期限なし" when there is no expiry date', () => {
    render(<ExpiryBadge expiryDate={null} />);
    expect(screen.getByText('期限なし')).toBeInTheDocument();
  });

  it('shows a countdown for a nearby expiry date', () => {
    render(<ExpiryBadge expiryDate="2026-07-24" />);
    expect(screen.getByText('明日まで')).toBeInTheDocument();
  });

  it('shows an expired label for a past date', () => {
    render(<ExpiryBadge expiryDate="2026-07-20" />);
    expect(screen.getByText('3日前に期限切れ')).toBeInTheDocument();
  });
});
