import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';
import { describe, it, expect, beforeEach, vi } from 'vitest';
describe('useTheme', function () {
    beforeEach(function () {
        localStorage.clear();
        vi.clearAllMocks();
    });
    it('should initialize with system theme', function () {
        var result = renderHook(function () { return useTheme(); }).result;
        expect(result.current[0]).toBe('system');
    });
    it('should load theme from localStorage if available', function () {
        localStorage.setItem('ui-theme', 'dark');
        var result = renderHook(function () { return useTheme(); }).result;
        expect(result.current[0]).toBe('dark');
    });
    it('should update theme when setTheme is called', function () {
        var result = renderHook(function () { return useTheme(); }).result;
        act(function () {
            result.current[1]('dark');
        });
        expect(result.current[0]).toBe('dark');
        expect(localStorage.getItem('ui-theme')).toBe('dark');
    });
    it('should use custom storage key if provided', function () {
        var result = renderHook(function () { return useTheme('custom-theme-key'); }).result;
        act(function () {
            result.current[1]('dark');
        });
        expect(localStorage.getItem('custom-theme-key')).toBe('dark');
    });
    it('should apply theme to document root', function () {
        var result = renderHook(function () { return useTheme(); }).result;
        var root = window.document.documentElement;
        act(function () {
            result.current[1]('dark');
        });
        expect(root.classList.contains('dark')).toBe(true);
        act(function () {
            result.current[1]('light');
        });
        expect(root.classList.contains('light')).toBe(true);
        expect(root.classList.contains('dark')).toBe(false);
    });
});
