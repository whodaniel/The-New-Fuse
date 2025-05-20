"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentSchema = void 0;
() => ;
().min(1, 'Description is required'),
    capabilities;
z.array(z.string()).min(1, 'At least one capability is required'),
    configuration;
z.object({
    model: z.string(), z, : .number().min(0).max(1),
    maxTokens: z.number().min(1),
    stopSequences: z.array(z.string()),
    customInstructions: z.string(),
}),
;
;
//# sourceMappingURL = z.object( {
nametypes.js.map;
//# sourceMappingURL=types.js.map