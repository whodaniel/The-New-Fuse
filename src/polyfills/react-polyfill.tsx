// filepath: src/polyfills/react-polyfill.ts
if(typeof window === "undefined") {
  global.window = {} as any;
  global.document = {} as any;
  global.navigator = { userAgent: "node" } as any;
  global.React = {
    createElement: () => ({}),
    Fragment: Symbol("Fragment"),
  } as any;
  global.ReactDOM = {
    render: () => ({}),
    createRoot: () => ({ render: () => ({}), unmount: () => ({}) }),
  } as any;
}

export {};
