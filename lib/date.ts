import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export type ExpiryStatus = 'expired' | 'soon' | 'ok' | 'none';

export function getExpiryStatus(expiryDate: string | null, thresholdDays = 3): ExpiryStatus {
  if (!expiryDate) return 'none';
  const days = differenceInCalendarDays(parseISO(expiryDate), new Date());
  if (days < 0) return 'expired';
  if (days <= thresholdDays) return 'soon';
  return 'ok';
}

export function formatExpiryLabel(expiryDate: string | null): string {
  if (!expiryDate) return '期限なし';
  const days = differenceInCalendarDays(parseISO(expiryDate), new Date());
  if (days < 0) return `${Math.abs(days)}日前に期限切れ`;
  if (days === 0) return '今日まで';
  if (days === 1) return '明日まで';
  return `あと${days}日`;
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy/MM/dd');
}

export type CurrentSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export function getCurrentSeason(date = new Date()): CurrentSeason {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export const SEASON_LABEL: Record<CurrentSeason, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};
