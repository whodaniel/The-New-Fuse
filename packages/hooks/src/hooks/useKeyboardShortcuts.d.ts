interface ShortcutDefinition {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  preventDefault?: boolean;
}
interface UseKeyboardShortcutsProps {
  shortcuts: ShortcutDefinition[];
  enabled?: boolean;
}
export declare function useKeyboardShortcuts({
  shortcuts,
  enabled,
}: UseKeyboardShortcutsProps): void;
export {};
//# sourceMappingURL=useKeyboardShortcuts.d.ts.map
