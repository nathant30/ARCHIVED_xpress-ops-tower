// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        // Never auto-retry on rate limit - let UI handle the cooldown
        if (error instanceof ApiError && error.status === 429) return false;
        
        // Don't retry on 4xx client errors (except 429)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        
        // Retry up to 2 times on other errors (network, 5xx, etc)
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // exponential backoff
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes (was cacheTime in v4)
    },
    mutations: {
      retry(failureCount, error) {
        // Never auto-retry mutations on rate limit
        if (error instanceof ApiError && error.status === 429) return false;
        
        // Generally no automatic retries for mutations to avoid duplicate side effects
        return false;
      },
    },
  },
});

// Optional: React Query hook that integrates with our API client
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiFetch, ApiOptions } from '@/lib/api';

export function useApiQuery<T = unknown>(
  path: string,
  options?: ApiOptions,
  queryOptions?: Omit<UseQueryOptions<{ data: T; rate: any }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [path, options],
    queryFn: () => apiFetch<T>(path, options),
    ...queryOptions,
  });
}

export function useApiMutation<T = unknown>(
  path: string,
  options?: Omit<ApiOptions, 'body'>,
  mutationOptions?: UseMutationOptions<{ data: T; rate: any }, ApiError, unknown>
) {
  return useMutation({
    mutationFn: (body: unknown) => apiFetch<T>(path, { ...options, body }),
    ...mutationOptions,
  });
}