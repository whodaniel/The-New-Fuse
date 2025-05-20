import { type ApiError, type ApiOptions } from '@/lib/api-client';
interface UseApiOptions extends Omit<ApiOptions, 'token'> {
    withAuth?: boolean;
}
export declare function useApi(): {
    loading: boolean;
    error: any;
    callApi: <T>(options: UseApiOptions) => Promise<T | null>;
};
export type { ApiError, ApiOptions };
