export function formatDateTime(value: unknown, options: Intl.DateTimeFormatOptions = {}): string {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return '-';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    ...options,
  }).format(date);
}

export function formatDate(value: unknown): string {
  return formatDateTime(value, { dateStyle: 'short', timeStyle: undefined });
}

export function formatMoney(value: unknown): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(number)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function currencyInputToDecimal(value: string): string {
  const digits = digitsOnly(value);
  if (!digits) {
    return '';
  }
  const padded = digits.padStart(3, '0');
  const cents = padded.slice(-2);
  const reais = padded.slice(0, -2).replace(/^0+(?=\d)/, '') || '0';
  return `${reais}.${cents}`;
}

export function formatCurrencyInput(value: string): string {
  const decimal = currencyInputToDecimal(value);
  return decimal ? formatMoney(decimal) : '';
}
