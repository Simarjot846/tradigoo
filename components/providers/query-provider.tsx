'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Cache data for 5 minutes by default
                staleTime: 5 * 60 * 1000,
                // Retry failed requests once
                retry: 1,
                // Refetch on window focus implies data is always fresh, which causes "lag" feel if network is slow.
                // Turn off for better UX unless critical.
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
