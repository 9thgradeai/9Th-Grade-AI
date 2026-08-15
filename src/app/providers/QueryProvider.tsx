import { type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/lib/api/queryClient'

let client: ReturnType<typeof createQueryClient> | null = null

function getQueryClient() {
  if (!client) {
    client = createQueryClient()
  }
  return client
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
