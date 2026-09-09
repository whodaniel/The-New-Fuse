import type { AxiosRequestConfig } from 'axios';

/**
 * Structural contract for API clients consumed by services.
 *
 * Services depend on this interface (not a concrete class) so that any
 * client implementation exposing the standard HTTP verb surface can be
 * injected — e.g. the synchronous `ApiClient` from `../api-client.ts`.
 * (Typed-class parameters would fail structural compatibility because
 * TypeScript treats differing private members as nominal.)
 */
export interface IApiClient {
  get<_T = any>(url: string, config?: AxiosRequestConfig): Promise<any>;
  post<_T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
  put<_T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
  patch<_T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
  delete<_T = any>(url: string, config?: AxiosRequestConfig): Promise<any>;
}
