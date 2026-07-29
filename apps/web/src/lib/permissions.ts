export const PERMISSIONS = [
  'dashboard.read',
  'classes.read_own',
  'classes.read_all',
  'classes.create',
  'classes.update',
  'classes.cancel',
  'attendance.read',
  'attendance.manage',
  'students.read',
  'students.create',
  'students.update_basic',
  'students.update_sensitive',
  'students.archive',
  'assessments.read',
  'assessments.create',
  'assessments.update_draft',
  'assessment_templates.manage',
  'trial_students.manage',
  'payments.read',
  'payments.manage',
  'reports.read',
  'staff.manage',
  'permissions.manage',
  'studio_settings.manage',
  'audit_logs.read',
  'devices.manage',
  'capacity.override',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function hasPermission(
  granted: readonly string[] | undefined,
  required: Permission | Permission[],
): boolean {
  const permissions = new Set(granted ?? []);
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((permission) => permissions.has(permission));
}
