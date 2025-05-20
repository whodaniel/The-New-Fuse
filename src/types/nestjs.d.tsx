/**
 * Type declarations for NestJS modules
 */

declare module "@nestjs/common" {
  export const Injectable: () => ClassDecorator;
  export const Controller: (prefix?: string) => ClassDecorator;
  export const Get: (path?: string) => MethodDecorator;
  export const Post: (path?: string) => MethodDecorator;
  export const Put: (path?: string) => MethodDecorator;
  export const Delete: (path?: string) => MethodDecorator;
  export const Patch: (path?: string) => MethodDecorator;
  export const Body: (param?: string) => ParameterDecorator;
  export const Param: (param?: string) => ParameterDecorator;
  export const Query: (param?: string) => ParameterDecorator;
  export const Headers: (param?: string) => ParameterDecorator;
  export const Req: () => ParameterDecorator;
  export const Res: () => ParameterDecorator;
  export const UseGuards: (
    ...guards: unknown[]
  ) => MethodDecorator & ClassDecorator;
  export const Module: (options: unknown) => ClassDecorator;

  export interface OnModuleInit {
    onModuleInit(): Promise<void> | void;
  }

  export interface OnModuleDestroy {
    onModuleDestroy(): Promise<void> | void;
  }
}
