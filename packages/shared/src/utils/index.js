// Export utility functions
// Common string utilities
export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
export const truncate = (str, length) => {
    return str.length > length ? str.substring(0, length) : str;
};
// Common object utilities
export const deepMerge = (target, source) => {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            const k = key;
            if (isObject(source[k])) {
                if (!(k in target)) {
                    Object.assign(output, { [k]: source[k] });
                }
                else {
                    output[k] = deepMerge(target[k], source[k]);
                }
            }
            else {
                Object.assign(output, { [k]: source[k] });
            }
        });
    }
    return output;
};
const isObject = (item) => {
    return Boolean(item && typeof item === 'object' && !Array.isArray(item));
};
//# sourceMappingURL=index.js.map