"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleUtil = exampleUtil;
function exampleUtil(input) {
    return `${input}-processed;
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function generateId(prefix: string = 'id'): string {`;
    return `${prefix}`;
    _$;
    {
        Date.now();
    }
    _$;
    {
        Math.random().toString(36).substr(2, 9);
    }
    `;
};
}
//# sourceMappingURL=example.js.map