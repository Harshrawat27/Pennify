export type CurrencyInfo = {
  code: string;
  symbol: string;
  locale: string;
  name: string;
};

export const CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  CNY: { code: 'CNY', symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan' },
  KRW: { code: 'KRW', symbol: '₩', locale: 'ko-KR', name: 'South Korean Won' },
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', name: 'Brazilian Real' },
};

export function getCurrencySymbol(code: string): string {
  return CURRENCIES[code]?.symbol ?? '₹';
}

export function formatCurrency(amount: number, code: string): string {
  const abs = Math.abs(amount);
  const info = CURRENCIES[code];
  if (!info) return '₹' + abs.toLocaleString('en-IN');
  return info.symbol + abs.toLocaleString(info.locale);
}

export function formatCurrencyCompact(amount: number, code: string): string {
  const abs = Math.abs(amount);
  const info = CURRENCIES[code];
  const symbol = info?.symbol ?? '₹';

  if (abs >= 1_000_000) return symbol + (abs / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return symbol + (abs / 1_000).toFixed(0) + 'k';

  return formatCurrency(amount, code);
}
