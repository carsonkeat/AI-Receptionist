/**
 * Supabase realtime subscriptions hook
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export const useRealtimeCalls = (receptionistId?: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    let channel = supabase
      .channel('calls_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: receptionistId ? `receptionist_id=eq.${receptionistId}` : undefined,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['calls'] })
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [receptionistId, queryClient])
}

export const useRealtimeMetrics = (userId?: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    // Subscribe to calls changes which affect metrics
    let channel = supabase
      .channel('metrics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['metrics'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}

