import { UnknownRecord, isRecord, readNumber, readString } from './api';

export const STUDIO_BRAND_COLORS = [
  '#1f7a6d',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#dc2626',
  '#ea580c',
  '#b7791f',
  '#16a34a',
  '#0891b2',
  '#4f46e5',
  '#0f766e',
  '#be123c',
  '#9333ea',
  '#047857',
  '#334155',
] as const;

export type StudioBrandColor = (typeof STUDIO_BRAND_COLORS)[number];

export type StudioLogo = {
  id: string;
  downloadUrl: string;
  originalName?: string | null;
  mimeType: string;
  size: number;
  expiresAt: string;
};

export type StudioSettings = {
  defaultClassDurationMinutes: number;
  defaultClassCapacity: number;
  cancellationNoticeHours: number;
  maxJustifiedAbsences: number;
  replacementCreditValidityDays: number;
  requireJustificationText: boolean;
  replacementNoShowConsumesCredit: boolean;
};

export type StudioProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  cnpj?: string | null;
  timezone: string;
  brandColor: string;
  onboardingStep: number;
  onboardingCompletedAt?: string | null;
  settings?: StudioSettings | null;
  logo?: StudioLogo | null;
};

export function normalizeStudio(value: unknown): StudioProfile | null {
  if (!isRecord(value)) {
    return null;
  }
  const settings = isRecord(value.settings) ? value.settings : {};
  const logo = isRecord(value.logo) ? value.logo : null;
  return {
    id: readString(value, 'id'),
    name: readString(value, 'name', 'Estudio'),
    email: readString(value, 'email'),
    phone: readOptionalString(value, 'phone'),
    whatsapp: readOptionalString(value, 'whatsapp'),
    zipCode: readOptionalString(value, 'zipCode'),
    street: readOptionalString(value, 'street'),
    number: readOptionalString(value, 'number'),
    complement: readOptionalString(value, 'complement'),
    district: readOptionalString(value, 'district'),
    city: readOptionalString(value, 'city'),
    state: readOptionalString(value, 'state'),
    cnpj: readOptionalString(value, 'cnpj'),
    timezone: readString(value, 'timezone', 'America/Sao_Paulo'),
    brandColor: readString(value, 'brandColor', STUDIO_BRAND_COLORS[0]),
    onboardingStep: readNumber(value, 'onboardingStep'),
    onboardingCompletedAt: readOptionalString(value, 'onboardingCompletedAt'),
    settings: {
      defaultClassDurationMinutes: readNumber(settings, 'defaultClassDurationMinutes', 50),
      defaultClassCapacity: readNumber(settings, 'defaultClassCapacity', 6),
      cancellationNoticeHours: readNumber(settings, 'cancellationNoticeHours', 12),
      maxJustifiedAbsences: readNumber(settings, 'maxJustifiedAbsences', 1),
      replacementCreditValidityDays: readNumber(settings, 'replacementCreditValidityDays', 30),
      requireJustificationText: readBoolean(settings, 'requireJustificationText', true),
      replacementNoShowConsumesCredit: readBoolean(settings, 'replacementNoShowConsumesCredit', true),
    },
    logo: logo ? normalizeLogo(logo) : null,
  };
}

export function applyBrandColor(color: string): void {
  if (!STUDIO_BRAND_COLORS.some((item) => item === color)) {
    return;
  }
  document.documentElement.style.setProperty('--color-primary', color);
  document.documentElement.style.setProperty('--color-primary-strong', strongColor(color));
}

export function studioInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = words.map((word) => word[0]?.toUpperCase() ?? '').join('');
  return initials || 'PM';
}

function normalizeLogo(value: UnknownRecord): StudioLogo {
  return {
    id: readString(value, 'id'),
    downloadUrl: readString(value, 'downloadUrl'),
    originalName: readOptionalString(value, 'originalName'),
    mimeType: readString(value, 'mimeType'),
    size: readNumber(value, 'size'),
    expiresAt: readString(value, 'expiresAt'),
  };
}

function readOptionalString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readBoolean(record: UnknownRecord, key: string, fallback: boolean): boolean {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
}

function strongColor(color: string): string {
  const hex = color.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgb(${Math.max(red - 28, 0)} ${Math.max(green - 28, 0)} ${Math.max(blue - 28, 0)})`;
}
