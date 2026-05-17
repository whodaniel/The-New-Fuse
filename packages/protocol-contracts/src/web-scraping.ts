import { z } from 'zod';

export const ScrapeRequestSchema = z
  .object({
    url: z.string().url(),
    max_chars: z.int().min(1).optional().default(2000),
    timeout_ms: z.int().min(1).optional().default(25000),
    main_content_only: z.boolean().optional().default(true),
  })
  .strict();

export const ScrapeResponseSchema = z
  .object({
    success: z.boolean(),
    url: z.string().url(),
    title: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    markdown: z.string().nullable().optional(),
    error: z.string().nullable().optional(),
  })
  .strict();

export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
export type ScrapeResponse = z.infer<typeof ScrapeResponseSchema>;
