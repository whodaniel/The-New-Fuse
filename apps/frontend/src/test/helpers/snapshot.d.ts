import React from 'react';
import { create } from 'react-test-renderer';
export declare const createSnapshot: (ui: React.ReactElement, options?: {
    theme?: "light" | "dark";
}) => any;
export declare const updateSnapshot: (renderer: ReturnType<typeof create>) => void;
export declare const assertSnapshot: (ui: React.ReactElement, options?: {
    theme?: "light" | "dark";
}) => any;
