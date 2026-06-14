import { z } from 'zod';
export declare const ScrapeRequestSchema: z.ZodObject<{
    url: z.ZodString;
    max_chars: z.ZodDefault<z.ZodOptional<z.ZodInt>>;
    timeout_ms: z.ZodDefault<z.ZodOptional<z.ZodInt>>;
    main_content_only: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const ScrapeResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    url: z.ZodString;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    text: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    markdown: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strict>;
export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
export type ScrapeResponse = z.infer<typeof ScrapeResponseSchema>;
//# sourceMappingURL=web-scraping.d.ts.map