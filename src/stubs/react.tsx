// Stub React implementation for reactflow
const React = {
  createElement: () => ({}),
  useState: () => [null, () => {}],
  useEffect: () => {},
  useCallback: (fn: unknown) => fn,
  useMemo: (fn: unknown) => fn(),
};

export default React;
