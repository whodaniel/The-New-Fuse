export const generateId = (): string => {
  // Try to use crypto for secure random numbers if available, fallback if not
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    const randomStr = array[0].toString(36).padStart(7, '0') + array[1].toString(36).padStart(7, '0');
    return `id_${randomStr.substring(0, 9)}_${Date.now()}`;
  }
  // SECURITY WARNING: Fallback uses Math.random() which is not cryptographically secure
  return `id_${Math.random().toString(36).substring(2, 11).padEnd(9, '0')}_${Date.now()}`;
};
