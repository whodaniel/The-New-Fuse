// @ts-nocheck
/**
 * Radix-style compound Select API (Select/SelectTrigger/SelectContent/
 * SelectItem/SelectValue), implemented on top of @the-new-fuse/ui-consolidated's
 * real Select component.
 *
 * The node components in this package were written against a Radix-style
 * compound Select that doesn't exist in ui-consolidated: its `Select` is a
 * single native-<select>-based component taking an `options` prop, not
 * composable Trigger/Content/Item pieces. Rather than hand-rewrite every
 * node's already-styled dropdown JSX (9 call sites, each with custom
 * per-item classNames and emoji labels), this shim keeps the compound API
 * surface the node components already use and adapts it onto the real
 * component: `SelectItem` children are walked to build an `options` array,
 * `onValueChange` is wired to the native `onChange`, and the layout-only
 * pieces (`SelectTrigger`, `SelectValue`, `SelectContent`) become no-ops —
 * their content is never mounted, only introspected for its value/label.
 */
import { Select as BaseSelect } from '@the-new-fuse/ui-consolidated';
import React from 'react';

export interface SelectItemProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/** Never rendered directly — SelectItem elements are introspected by <Select>. */
export const SelectItem: React.FC<SelectItemProps> = () => null;

export interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
}
/** Layout-only in the Radix API; the native <select> needs no separate trigger. */
export const SelectTrigger: React.FC<SelectTriggerProps> = () => null;

export interface SelectValueProps {
  placeholder?: string;
}
/** Layout-only; a native <select> shows its own current value. */
export const SelectValue: React.FC<SelectValueProps> = () => null;

export interface SelectContentProps {
  children?: React.ReactNode;
  className?: string;
}
/** Never rendered directly — its SelectItem children are introspected by <Select>. */
export const SelectContent: React.FC<SelectContentProps> = () => null;

export interface SelectGroupProps {
  children?: React.ReactNode;
}
/** Never rendered directly — its SelectItem descendants are still found by recursion. */
export const SelectGroup: React.FC<SelectGroupProps> = () => null;

export interface SelectLabelProps {
  children?: React.ReactNode;
  className?: string;
}
/** Never rendered — a group heading with no SelectItem descendants of its own. */
export const SelectLabel: React.FC<SelectLabelProps> = () => null;

function childrenToText(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join('');
  return '';
}

function collectOptions(node: React.ReactNode): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      const itemProps = child.props as SelectItemProps;
      options.push({
        value: itemProps.value,
        label: childrenToText(itemProps.children) || itemProps.value,
      });
      return;
    }
    // Recurse into SelectContent (or any other wrapper) to find SelectItems.
    const nested = (child.props as { children?: React.ReactNode } | undefined)?.children;
    if (nested) options.push(...collectOptions(nested));
  });
  return options;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
  const options = React.useMemo(() => collectOptions(children), [children]);
  return (
    <BaseSelect
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value)}
      options={options}
      className={className}
    />
  );
};
