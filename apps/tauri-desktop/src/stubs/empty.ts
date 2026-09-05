const empty: any = new Proxy(function () {}, {
  get: () => empty,
  apply: () => empty,
  construct: () => empty,
});
export default empty;
export const Redis = empty;
export const Cluster = empty;
