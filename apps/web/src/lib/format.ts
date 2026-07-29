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
