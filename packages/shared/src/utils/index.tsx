// Export utility functions

// Common string utilities
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncate = (str: string, length: number): string => {
  return str.length > length ? str.substring(0, length) : str;
};

// Common object utilities
export const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const k = key as keyof T;
      if (isObject(source[k])) {
        if (!(k in target)) {
          Object.assign(output, { [k]: source[k] });
        } else {
          (output as any)[k] = deepMerge((target as any)[k], (source as any)[k]);
        }
      } else {
        Object.assign(output, { [k]: source[k] });
      }
    });
  }

  return output;
};

const isObject = (item: unknown): item is Record<string, any> => {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}