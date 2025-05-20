declare const React: {
  createElement: () => {};
  useState: () => (() => void)[];
  useEffect: () => void;
  useCallback: (fn: unknown) => any;
  useMemo: (fn: unknown) => any;
  useRef: () => {
    current: unknown;
  };
};
export default React;
