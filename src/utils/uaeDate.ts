export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

export const UAE_LOCATIONS = [
  'ساحة الحجز – مصفح',
  'ساحة الحجز – العين',
  'ساحة الحجز – الشارقة',
  'ساحة الحجز – الفجيرة',
  'ساحة الحجز – رأس الخيمة',
  'ساحة الحجز – الظفرة',
] as const;

export function getUaeCurrentDate(): {
  year: number;
  month: number;
  day: number;
  isoDate: string;
  formattedDateTime: string;
} {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value || '0');

  const year = getPart('year') || now.getFullYear();
  const month = getPart('month') || now.getMonth() + 1;
  const day = getPart('day') || now.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const isoDate = `${year}-${pad(month)}-${pad(day)}`;
  const hour = pad(getPart('hour'));
  const minute = pad(getPart('minute'));

  return {
    year,
    month,
    day,
    isoDate,
    formattedDateTime: `${isoDate} ${hour}:${minute} (بتوقيت الإمارات)`,
  };
}

export function getMonthLabel(month: number | 'all'): string {
  if (month === 'all') return 'جميع الأشهر (تقرير سنوي)';
  return ARABIC_MONTHS[month - 1] || String(month);
}

export function formatAED(amount: number, showDecimals = false): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(Math.round(showDecimals ? safe * 100 : safe) / (showDecimals ? 100 : 1));
  return `AED ${formatted}`;
}

export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function generateSafeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function assetUrl(relativePath: string): string {
  const base =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${normalizedBase}${cleanPath}`;
}

export function formatTimestampForDisplay(ts: unknown): string {
  if (!ts) return '—';
  if (typeof ts === 'string') return ts.slice(0, 16).replace('T', ' ');
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    const d = (ts as { toDate: () => Date }).toDate();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }
  return '—';
}
