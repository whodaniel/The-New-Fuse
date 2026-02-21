declare module "cron-parser" {
  export function parseExpression(
    expression: string,
    options?: unknown,
  ): {
    next: () => { toDate: () => Date };
    prev: () => { toDate: () => Date };
  };
}
