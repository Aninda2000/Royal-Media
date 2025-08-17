"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { AuthProvider } from "@/hooks/use-auth"
import { NotificationProvider } from "./providers/NotificationProvider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              if (typeof error === 'object' && error !== null && 'status' in error) {
                const errorWithStatus = error as { status: number };
                if (errorWithStatus.status >= 400 && errorWithStatus.status < 500) {
                  return false;
                }
              }
              return failureCount < 2
            },
          },
          mutations: {
            retry: (failureCount, error: unknown) => {
              // Don't retry mutations on 4xx errors
              if (typeof error === 'object' && error !== null && 'status' in error) {
                const errorWithStatus = error as { status: number };
                if (errorWithStatus.status >= 400 && errorWithStatus.status < 500) {
                  return false;
                }
              }
              return failureCount < 1
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...{}}
      >
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster position="top-right" />
          </NotificationProvider>
        </AuthProvider>
      </NextThemesProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}