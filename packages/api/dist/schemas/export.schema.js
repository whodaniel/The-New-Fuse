// Schema for validating export conversation requests
export const exportSchema = {
    conversation: { type: 'string', required: true, minLength: 1 },
    format: { type: 'string', required: true, enum: ['pdf', 'md', 'txt'] },
};
//# sourceMappingURL=export.schema.js.map