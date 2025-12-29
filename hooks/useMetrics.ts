/**
 * Metrics data fetching hook
 */

import { useQuery } from '@tanstack/react-query'
import { getUserMetrics, getReceptionistMetrics } from '@/lib/api/metrics'

export const useUserMetrics = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['metrics', 'user', userId],
    queryFn: () => getUserMetrics(userId!),
    enabled: !!userId,
  })
}

export const useReceptionistMetrics = (receptionistId: string | undefined) => {
  return useQuery({
    queryKey: ['metrics', 'receptionist', receptionistId],
    queryFn: () => getReceptionistMetrics(receptionistId!),
    enabled: !!receptionistId,
  })
}

