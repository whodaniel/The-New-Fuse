var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
import * as React from 'react';

import { cn } from '@/utils/cn';
import { cva } from 'class-variance-authority';
import { Check, ChevronDown } from 'lucide-react';
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const selectTriggerVariants = cva(
  'flex w-full items-center justify-between rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        ghost: 'border-none bg-transparent focus:ring-0 focus:ring-offset-0',
        outline: 'border-2',
        filled: 'border-transparent bg-muted',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-lg',
      },
      state: {
        default: '',
        error: 'border-destructive focus:ring-destructive',
        success: 'border-success focus:ring-success',
      },
      width: {
        default: 'w-full',
        auto: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
      width: 'default',
    },
  }
);
const SelectTrigger = React.forwardRef((props, ref) => {
  var { className, variant, size, state, width, error, success, children } = props,
    restProps = __rest(props, [
      'className',
      'variant',
      'size',
      'state',
      'width',
      'error',
      'success',
      'children',
    ]);
  const triggerState = error ? 'error' : success ? 'success' : state;
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        selectTriggerVariants({ variant, size, state: triggerState, width }),
        className
      )}
      {...restProps}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectContent = React.forwardRef((props, ref) => {
  var { className, children, containerClassName, position = 'popper' } = props,
    restProps = __rest(props, ['className', 'children', 'containerClassName', 'position']);
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...restProps}
      >
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
            containerClassName
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef((props, ref) => {
  var { className } = props,
    restProps = __rest(props, ['className']);
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
      {...restProps}
    />
  );
});
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef((props, ref) => {
  var { className, children, description, icon } = props,
    restProps = __rest(props, ['className', 'children', 'description', 'icon']);
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...restProps}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          {icon || <Check className="h-4 w-4" />}
        </SelectPrimitive.ItemIndicator>
      </span>
      <div className="flex flex-col">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef((props, ref) => {
  var { className } = props,
    restProps = __rest(props, ['className']);
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      {...restProps}
    />
  );
});
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
