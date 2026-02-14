export type CurrencyInfo = {
  code: string;
  symbol: string;
  locale: string;
  name: string;
};

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '\u20AC', locale: 'de-DE', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '\u00A3', locale: 'en-GB', name: 'British Pound' },
  INR: { code: 'INR', symbol: '\u20B9', locale: 'en-IN', name: 'Indian Rupee' },
  JPY: { code: 'JPY', symbol: '\u00A5', locale: 'ja-JP', name: 'Japanese Yen' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  CAD: { code: 'CAD', symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  CNY: { code: 'CNY', symbol: '\u00A5', locale: 'zh-CN', name: 'Chinese Yuan' },
  KRW: { code: 'KRW', symbol: '\u20A9', locale: 'ko-KR', name: 'South Korean Won' },
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', name: 'Brazilian Real' },
  CHF: { code: 'CHF', symbol: 'CHF', locale: 'de-CH', name: 'Swiss Franc' },
  SEK: { code: 'SEK', symbol: 'kr', locale: 'sv-SE', name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr', locale: 'nb-NO', name: 'Norwegian Krone' },
  DKK: { code: 'DKK', symbol: 'kr', locale: 'da-DK', name: 'Danish Krone' },
  NZD: { code: 'NZD', symbol: 'NZ$', locale: 'en-NZ', name: 'New Zealand Dollar' },
  SGD: { code: 'SGD', symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar' },
  HKD: { code: 'HKD', symbol: 'HK$', locale: 'en-HK', name: 'Hong Kong Dollar' },
  MXN: { code: 'MXN', symbol: 'MX$', locale: 'es-MX', name: 'Mexican Peso' },
  ZAR: { code: 'ZAR', symbol: 'R', locale: 'en-ZA', name: 'South African Rand' },
  THB: { code: 'THB', symbol: '\u0E3F', locale: 'th-TH', name: 'Thai Baht' },
  PHP: { code: 'PHP', symbol: '\u20B1', locale: 'en-PH', name: 'Philippine Peso' },
  IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID', name: 'Indonesian Rupiah' },
  MYR: { code: 'MYR', symbol: 'RM', locale: 'ms-MY', name: 'Malaysian Ringgit' },
  AED: { code: 'AED', symbol: 'AED', locale: 'ar-AE', name: 'UAE Dirham' },
  SAR: { code: 'SAR', symbol: 'SAR', locale: 'ar-SA', name: 'Saudi Riyal' },
};

export function getCurrencySymbol(code: string): string {
  return CURRENCIES[code]?.symbol ?? '\u20B9';
}

export function formatCurrency(amount: number, code: string): string {
  const abs = Math.abs(amount);
  const info = CURRENCIES[code];
  if (!info) return '\u20B9' + abs.toLocaleString('en-IN');
  return info.symbol + abs.toLocaleString(info.locale);
}

export function formatCurrencyCompact(amount: number, code: string): string {
  const abs = Math.abs(amount);
  const info = CURRENCIES[code];
  const symbol = info?.symbol ?? '\u20B9';

  if (abs >= 1_000_000) return symbol + (abs / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return symbol + (abs / 1_000).toFixed(0) + 'k';

  return formatCurrency(amount, code);
}
