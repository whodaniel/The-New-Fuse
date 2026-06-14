/**
 * React Testing Helpers
 *
 * Utilities for testing React components across the monorepo.
 */
import React from 'react';
import { RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Custom render function with common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialState?: any;
    route?: string;
}
/**
 * Render with all providers
 */
export declare function renderWithProviders(ui: React.ReactElement, options?: CustomRenderOptions): RenderResult & {
    user: ReturnType<typeof userEvent.setup>;
};
/**
 * Wait for loading to complete
 */
export declare function waitForLoadingToFinish(): Promise<void>;
/**
 * Mock IntersectionObserver
 */
export declare function mockIntersectionObserver(): void;
/**
 * Mock ResizeObserver
 */
export declare function mockResizeObserver(): void;
/**
 * Mock matchMedia
 */
export declare function mockMatchMedia(matches?: boolean): void;
/**
 * Create a mock file for file input testing
 */
export declare function createMockFile(name: string, size: number, type: string, lastModified?: number): File;
/**
 * Trigger file input change
 */
export declare function uploadFile(input: HTMLElement, file: File | File[]): Promise<void>;
//# sourceMappingURL=react-helpers.d.ts.map