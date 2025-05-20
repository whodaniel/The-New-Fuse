declare namespace inversify {
  export class Container {
    bind<T>(serviceIdentifier: unknown): unknown;
    get<T>(serviceIdentifier: unknown): T;
    resolve<T>(constructor: unknown): T;
    load(...modules: unknown[]): void;
  }
}

export const container: inversify.Container;
