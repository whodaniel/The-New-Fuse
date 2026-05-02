import { BaseResponse } from './core/base-types';

export type ApiResponse<T = unknown> = BaseResponse<T>;

export interface Handler<T = unknown, R = unknown> {
  handle(input: T): Promise<R>;
}
