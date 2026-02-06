export * from './internal-hooks.js';

export type HookEventType = import('./internal-hooks.js').InternalHookEventType;
export type HookEvent = import('./internal-hooks.js').InternalHookEvent;
export type HookHandler = import('./internal-hooks.js').InternalHookHandler;

export {
  clearInternalHooks as clearHooks,
  createInternalHookEvent as createHookEvent,
  getRegisteredEventKeys as getRegisteredHookEventKeys,
  registerInternalHook as registerHook,
  triggerInternalHook as triggerHook,
  unregisterInternalHook as unregisterHook,
} from './internal-hooks.js';
