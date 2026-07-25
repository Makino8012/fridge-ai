import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpiryBadge } from './expiry-badge';
import type { ShelfLifeInput } from '@/lib/shelf-life';

function item(overrides: Partial<ShelfLifeInput> = {}): ShelfLifeInput {
  return {
    category_id: 'vegetable',
    storage_location_id: 'fridge',
    expiry_date: null,
    created_at: '2026-07-22T00:00:00+09:00',
    ...overrides,
  };
}

describe('ExpiryBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T00:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "期限なし" for categories we do not estimate', () => {
    render(<ExpiryBadge item={item({ category_id: 'seasoning' })} />);
    expect(screen.getByText('期限なし')).toBeInTheDocument();
  });

  it('shows a countdown for a nearby expiry date', () => {
    render(<ExpiryBadge item={item({ expiry_date: '2026-07-24' })} />);
    expect(screen.getByText('明日まで')).toBeInTheDocument();
  });

  it('shows an expired label for a past date', () => {
    render(<ExpiryBadge item={item({ expiry_date: '2026-07-20' })} />);
    expect(screen.getByText('3日前に期限切れ')).toBeInTheDocument();
  });

  it('falls back to an estimate when the expiry date is missing', () => {
    render(<ExpiryBadge item={item()} />);
    // 野菜(冷蔵)は7日もつ想定。7/22登録なので7/29まで=あと6日。
    expect(screen.getByText('目安').parentElement).toHaveTextContent('目安あと6日');
  });
});
