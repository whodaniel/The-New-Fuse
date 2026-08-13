const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on', 'enabled']);

const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  return TRUTHY_VALUES.has(value.trim().toLowerCase());
};

export const isFairtableFeatureEnabled = (): boolean =>
  isTruthy(String(import.meta.env.VITE_ENABLE_FAIRTABLE || 'true'));

export const isFairtableComponentsFeatureEnabled = (): boolean =>
  isTruthy(String(import.meta.env.VITE_ENABLE_FAIRTABLE_COMPONENTS || 'true'));
