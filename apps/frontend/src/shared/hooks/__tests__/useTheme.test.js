import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { vi } from 'vitest';
describe('useTheme', function () {
    var mockMatchMedia = vi.fn();
    beforeEach(function () {
        // Clear localStorage
        localStorage.clear();
        // Mock matchMedia
        window.matchMedia = mockMatchMedia;
    });
    it('should initialize with system theme', function () {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        var result = renderHook(function () { return useTheme(); }).result;
        expect(result.current[0]).toBe('system');
    });
    it('should load theme from localStorage if available', function () {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        localStorage.setItem('ui-theme', 'dark');
        var result = renderHook(function () { return useTheme(); }).result;
        expect(result.current[0]).toBe('dark');
    });
    it('should update theme when setTheme is called', function () {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        var result = renderHook(function () { return useTheme(); }).result;
        act(function () {
            result.current[1]('dark');
        });
        expect(result.current[0]).toBe('dark');
        expect(localStorage.getItem('ui-theme')).toBe('dark');
    });
    it('should respond to system theme changes', function () {
        var listeners = new Set();
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: function (event, callback) {
                listeners.add(callback);
            },
            removeEventListener: function (event, callback) {
                listeners.delete(callback);
            },
        });
        var result = renderHook(function () { return useTheme(); }).result;
        // Simulate system theme change
        act(function () {
            listeners.forEach(function (listener) {
                return listener({ matches: true });
            });
        });
        var root = window.document.documentElement;
        expect(root.classList.contains('dark')).toBe(true);
    });
    it('should use custom storage key if provided', function () {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
        var result = renderHook(function () { return useTheme('custom-theme-key'); }).result;
        act(function () {
            result.current[1]('dark');
        });
        expect(localStorage.getItem('custom-theme-key')).toBe('dark');
    });
    it('should clean up event listeners on unmount', function () {
        var removeEventListener = vi.fn();
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: removeEventListener,
        });
        var unmount = renderHook(function () { return useTheme(); }).unmount;
        unmount();
        expect(removeEventListener).toHaveBeenCalled();
    });
    it('should apply theme to document root', function () {
        mockMatchMedia.mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
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
