/**
 * React Testing Helpers
 *
 * Utilities for testing React components across the monorepo.
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function with common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any global providers here (e.g., Redux, Router, Theme)
  initialState?: any;
  route?: string;
}

/**
 * Render with all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  const { initialState, route = '/', ...renderOptions } = options;

  // Set up user event
  const user = userEvent.setup();

  // Update window location if route is provided
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  // Wrapper component with all providers
  function Wrapper({ children }: { children: React.ReactNode }) {
    // Add your providers here, for example:
    // return (
    //   <Provider store={createTestStore(initialState)}>
    //     <BrowserRouter>
    //       <ThemeProvider>
    //         {children}
    //       </ThemeProvider>
    //     </BrowserRouter>
    //   </Provider>
    // );
    return <>{children}</>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    user,
  };
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingToFinish() {
  const { waitForElementToBeRemoved, queryByText } = await import('@testing-library/react');
  const loading = queryByText(document.body, /loading/i);
  if (loading) {
    await waitForElementToBeRemoved(loading, { timeout: 5000 });
  }
}

/**
 * Mock IntersectionObserver
 */
export function mockIntersectionObserver() {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
}

/**
 * Mock ResizeObserver
 */
export function mockResizeObserver() {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;
}

/**
 * Mock matchMedia
 */
export function mockMatchMedia(matches: boolean = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Create a mock file for file input testing
 */
export function createMockFile(
  name: string,
  size: number,
  type: string,
  lastModified?: number
): File {
  const blob = new Blob(['a'.repeat(size)], { type });
  const file = new File([blob], name, { type, lastModified: lastModified || Date.now() });
  return file;
}

/**
 * Trigger file input change
 */
export async function uploadFile(input: HTMLElement, file: File | File[]) {
  const files = Array.isArray(file) ? file : [file];
  Object.defineProperty(input, 'files', {
    value: files,
    writable: false,
  });

  const { fireEvent } = await import('@testing-library/react');
  fireEvent.change(input);
}
