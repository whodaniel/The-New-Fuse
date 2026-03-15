// @ts-nocheck
'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });

import React from 'react';

export const Tabs = Tabs.Root;
export const TabsList = React.forwardRef((props, ref) => {
  var { className } = props,
    restProps = __rest(props, ['className']);
  return (
    <Tabs.List
      ref={ref}
      className={(0, utils_1.cn)(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...restProps}
    />
  );
});
TabsList.displayName = Tabs.List.displayName;
export const TabsTrigger = React.forwardRef((props, ref) => {
  var { className } = props,
    restProps = __rest(props, ['className']);
  return (
    <Tabs.Trigger
      ref={ref}
      className={(0, utils_1.cn)(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none',
        className
      )}
      {...restProps}
    />
  );
});
TabsTrigger.displayName = Tabs.Trigger.displayName;
export const TabsContent = React.forwardRef((props, ref) => {
  var { className } = props,
    restProps = __rest(props, ['className']);
  return (
    <Tabs.Content
      ref={ref}
      className={(0, utils_1.cn)(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...restProps}
    />
  );
});
TabsContent.displayName = Tabs.Content.displayName;
