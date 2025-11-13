import { z } from 'zod';
export declare const NavigateTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"navigate">;
    description: z.ZodLiteral<"Navigate to a URL">;
    arguments: z.ZodObject<{
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
    }, {
        url: string;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Navigate to a URL";
    name: "navigate";
    arguments: {
        url: string;
    };
}, {
    description: "Navigate to a URL";
    name: "navigate";
    arguments: {
        url: string;
    };
}>;
export declare const GoBackTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"go_back">;
    description: z.ZodLiteral<"Go back in browser history">;
    arguments: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
}, "strip", z.ZodTypeAny, {
    description: "Go back in browser history";
    name: "go_back";
    arguments: {};
}, {
    description: "Go back in browser history";
    name: "go_back";
    arguments: {};
}>;
export declare const GoForwardTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"go_forward">;
    description: z.ZodLiteral<"Go forward in browser history">;
    arguments: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
}, "strip", z.ZodTypeAny, {
    description: "Go forward in browser history";
    name: "go_forward";
    arguments: {};
}, {
    description: "Go forward in browser history";
    name: "go_forward";
    arguments: {};
}>;
export declare const ClickTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"click">;
    description: z.ZodLiteral<"Click on an element">;
    arguments: z.ZodObject<{
        selector: z.ZodString;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        selector: string;
        x?: number | undefined;
        y?: number | undefined;
    }, {
        selector: string;
        x?: number | undefined;
        y?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Click on an element";
    name: "click";
    arguments: {
        selector: string;
        x?: number | undefined;
        y?: number | undefined;
    };
}, {
    description: "Click on an element";
    name: "click";
    arguments: {
        selector: string;
        x?: number | undefined;
        y?: number | undefined;
    };
}>;
export declare const TypeTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"type">;
    description: z.ZodLiteral<"Type text into an element">;
    arguments: z.ZodObject<{
        selector: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        text: string;
        selector: string;
    }, {
        text: string;
        selector: string;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Type text into an element";
    name: "type";
    arguments: {
        text: string;
        selector: string;
    };
}, {
    description: "Type text into an element";
    name: "type";
    arguments: {
        text: string;
        selector: string;
    };
}>;
export declare const HoverTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"hover">;
    description: z.ZodLiteral<"Hover over an element">;
    arguments: z.ZodObject<{
        selector: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        selector: string;
    }, {
        selector: string;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Hover over an element";
    name: "hover";
    arguments: {
        selector: string;
    };
}, {
    description: "Hover over an element";
    name: "hover";
    arguments: {
        selector: string;
    };
}>;
export declare const DragTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"drag">;
    description: z.ZodLiteral<"Drag an element to a new position">;
    arguments: z.ZodObject<{
        fromSelector: z.ZodString;
        toSelector: z.ZodString;
        fromX: z.ZodOptional<z.ZodNumber>;
        fromY: z.ZodOptional<z.ZodNumber>;
        toX: z.ZodOptional<z.ZodNumber>;
        toY: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        fromSelector: string;
        toSelector: string;
        fromX?: number | undefined;
        fromY?: number | undefined;
        toX?: number | undefined;
        toY?: number | undefined;
    }, {
        fromSelector: string;
        toSelector: string;
        fromX?: number | undefined;
        fromY?: number | undefined;
        toX?: number | undefined;
        toY?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Drag an element to a new position";
    name: "drag";
    arguments: {
        fromSelector: string;
        toSelector: string;
        fromX?: number | undefined;
        fromY?: number | undefined;
        toX?: number | undefined;
        toY?: number | undefined;
    };
}, {
    description: "Drag an element to a new position";
    name: "drag";
    arguments: {
        fromSelector: string;
        toSelector: string;
        fromX?: number | undefined;
        fromY?: number | undefined;
        toX?: number | undefined;
        toY?: number | undefined;
    };
}>;
export declare const SelectOptionTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"select_option">;
    description: z.ZodLiteral<"Select an option from a dropdown">;
    arguments: z.ZodObject<{
        selector: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        selector: string;
    }, {
        value: string;
        selector: string;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Select an option from a dropdown";
    name: "select_option";
    arguments: {
        value: string;
        selector: string;
    };
}, {
    description: "Select an option from a dropdown";
    name: "select_option";
    arguments: {
        value: string;
        selector: string;
    };
}>;
export declare const PressKeyTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"press_key">;
    description: z.ZodLiteral<"Press a keyboard key">;
    arguments: z.ZodObject<{
        key: z.ZodString;
        modifiers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        key: string;
        modifiers?: string[] | undefined;
    }, {
        key: string;
        modifiers?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Press a keyboard key";
    name: "press_key";
    arguments: {
        key: string;
        modifiers?: string[] | undefined;
    };
}, {
    description: "Press a keyboard key";
    name: "press_key";
    arguments: {
        key: string;
        modifiers?: string[] | undefined;
    };
}>;
export declare const WaitTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"wait">;
    description: z.ZodLiteral<"Wait for a specified amount of time">;
    arguments: z.ZodObject<{
        milliseconds: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        milliseconds: number;
    }, {
        milliseconds: number;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Wait for a specified amount of time";
    name: "wait";
    arguments: {
        milliseconds: number;
    };
}, {
    description: "Wait for a specified amount of time";
    name: "wait";
    arguments: {
        milliseconds: number;
    };
}>;
export declare const SnapshotTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"snapshot">;
    description: z.ZodLiteral<"Take a snapshot of the current page">;
    arguments: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
}, "strip", z.ZodTypeAny, {
    description: "Take a snapshot of the current page";
    name: "snapshot";
    arguments: {};
}, {
    description: "Take a snapshot of the current page";
    name: "snapshot";
    arguments: {};
}>;
export declare const ScreenshotTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"screenshot">;
    description: z.ZodLiteral<"Take a screenshot of the current page">;
    arguments: z.ZodObject<{
        fullPage: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        fullPage?: boolean | undefined;
    }, {
        fullPage?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Take a screenshot of the current page";
    name: "screenshot";
    arguments: {
        fullPage?: boolean | undefined;
    };
}, {
    description: "Take a screenshot of the current page";
    name: "screenshot";
    arguments: {
        fullPage?: boolean | undefined;
    };
}>;
export declare const GetConsoleLogsTool: z.ZodObject<{} & {
    name: z.ZodLiteral<"get_console_logs">;
    description: z.ZodLiteral<"Get console logs from the browser">;
    arguments: z.ZodObject<{
        level: z.ZodOptional<z.ZodEnum<["log", "info", "warn", "error", "debug"]>>;
    }, "strip", z.ZodTypeAny, {
        level?: "error" | "warn" | "log" | "info" | "debug" | undefined;
    }, {
        level?: "error" | "warn" | "log" | "info" | "debug" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    description: "Get console logs from the browser";
    name: "get_console_logs";
    arguments: {
        level?: "error" | "warn" | "log" | "info" | "debug" | undefined;
    };
}, {
    description: "Get console logs from the browser";
    name: "get_console_logs";
    arguments: {
        level?: "error" | "warn" | "log" | "info" | "debug" | undefined;
    };
}>;
export type NavigateToolType = z.infer<typeof NavigateTool>;
export type GoBackToolType = z.infer<typeof GoBackTool>;
export type GoForwardToolType = z.infer<typeof GoForwardTool>;
export type ClickToolType = z.infer<typeof ClickTool>;
export type TypeToolType = z.infer<typeof TypeTool>;
export type HoverToolType = z.infer<typeof HoverTool>;
export type DragToolType = z.infer<typeof DragTool>;
export type SelectOptionToolType = z.infer<typeof SelectOptionTool>;
export type PressKeyToolType = z.infer<typeof PressKeyTool>;
export type WaitToolType = z.infer<typeof WaitTool>;
export type SnapshotToolType = z.infer<typeof SnapshotTool>;
export type ScreenshotToolType = z.infer<typeof ScreenshotTool>;
export type GetConsoleLogsToolType = z.infer<typeof GetConsoleLogsTool>;
export type MCPToolType = NavigateToolType | GoBackToolType | GoForwardToolType | ClickToolType | TypeToolType | HoverToolType | DragToolType | SelectOptionToolType | PressKeyToolType | WaitToolType | SnapshotToolType | ScreenshotToolType | GetConsoleLogsToolType;
//# sourceMappingURL=tool.d.ts.map