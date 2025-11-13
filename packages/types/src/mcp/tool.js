import { z } from 'zod';
// Base tool schema
const BaseToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    arguments: z.object({}).optional(),
});
// Navigation tools
export const NavigateTool = BaseToolSchema.extend({
    name: z.literal('navigate'),
    description: z.literal('Navigate to a URL'),
    arguments: z.object({
        url: z.string().url(),
    }),
});
export const GoBackTool = BaseToolSchema.extend({
    name: z.literal('go_back'),
    description: z.literal('Go back in browser history'),
    arguments: z.object({}),
});
export const GoForwardTool = BaseToolSchema.extend({
    name: z.literal('go_forward'),
    description: z.literal('Go forward in browser history'),
    arguments: z.object({}),
});
// Interaction tools
export const ClickTool = BaseToolSchema.extend({
    name: z.literal('click'),
    description: z.literal('Click on an element'),
    arguments: z.object({
        selector: z.string(),
        x: z.number().optional(),
        y: z.number().optional(),
    }),
});
export const TypeTool = BaseToolSchema.extend({
    name: z.literal('type'),
    description: z.literal('Type text into an element'),
    arguments: z.object({
        selector: z.string(),
        text: z.string(),
    }),
});
export const HoverTool = BaseToolSchema.extend({
    name: z.literal('hover'),
    description: z.literal('Hover over an element'),
    arguments: z.object({
        selector: z.string(),
    }),
});
export const DragTool = BaseToolSchema.extend({
    name: z.literal('drag'),
    description: z.literal('Drag an element to a new position'),
    arguments: z.object({
        fromSelector: z.string(),
        toSelector: z.string(),
        fromX: z.number().optional(),
        fromY: z.number().optional(),
        toX: z.number().optional(),
        toY: z.number().optional(),
    }),
});
export const SelectOptionTool = BaseToolSchema.extend({
    name: z.literal('select_option'),
    description: z.literal('Select an option from a dropdown'),
    arguments: z.object({
        selector: z.string(),
        value: z.string(),
    }),
});
export const PressKeyTool = BaseToolSchema.extend({
    name: z.literal('press_key'),
    description: z.literal('Press a keyboard key'),
    arguments: z.object({
        key: z.string(),
        modifiers: z.array(z.string()).optional(),
    }),
});
// Utility tools
export const WaitTool = BaseToolSchema.extend({
    name: z.literal('wait'),
    description: z.literal('Wait for a specified amount of time'),
    arguments: z.object({
        milliseconds: z.number(),
    }),
});
export const SnapshotTool = BaseToolSchema.extend({
    name: z.literal('snapshot'),
    description: z.literal('Take a snapshot of the current page'),
    arguments: z.object({}),
});
export const ScreenshotTool = BaseToolSchema.extend({
    name: z.literal('screenshot'),
    description: z.literal('Take a screenshot of the current page'),
    arguments: z.object({
        fullPage: z.boolean().optional(),
    }),
});
export const GetConsoleLogsTool = BaseToolSchema.extend({
    name: z.literal('get_console_logs'),
    description: z.literal('Get console logs from the browser'),
    arguments: z.object({
        level: z.enum(['log', 'info', 'warn', 'error', 'debug']).optional(),
    }),
});
//# sourceMappingURL=tool.js.map