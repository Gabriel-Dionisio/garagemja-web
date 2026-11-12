export interface TotpStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

export interface TotpSetup {
  secret: string;
  otpauthUri: string;
}

export const SECURITY_EVENT_TYPES = [
  'LOGIN',
  'SECOND_FACTOR_FAILED',
  'RECOVERY_CODE_USED',
  'TOTP_ENABLED',
  'TOTP_DISABLED',
  'SESSIONS_REVOKED',
  'RECOVERY_CODES_REGENERATED',
] as const;

export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  createdAt: string;
}

export function isSecurityEventType(value: unknown): value is SecurityEventType {
  return SECURITY_EVENT_TYPES.some((type) => type === value);
}
