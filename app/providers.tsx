"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide client providers.
 *
 * Note: HeroUI v3 does NOT require its own provider (unlike NextUI / HeroUI v2),
 * so the only thing we wrap with here is TanStack Query. Keeping all data access
 * behind React Query is what makes the mock→live API swap (see lib/api) invisible
 * to components — loading/empty/error states come for free.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
