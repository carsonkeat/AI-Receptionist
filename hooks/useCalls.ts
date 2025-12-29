/**
 * Calls data fetching hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCalls, getCall, createCall, updateCall, deleteCall } from '@/lib/api/calls'
import type { CreateCallRequest, UpdateCallRequest } from '@/types/api'

export const useCalls = (receptionistId?: string) => {
  return useQuery({
    queryKey: ['calls', receptionistId],
    queryFn: () => getCalls(receptionistId),
  })
}

export const useCall = (callId: string) => {
  return useQuery({
    queryKey: ['call', callId],
    queryFn: () => getCall(callId),
    enabled: !!callId,
  })
}

export const useCreateCall = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (call: CreateCallRequest) => createCall(call),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}

export const useUpdateCall = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ callId, updates }: { callId: string; updates: UpdateCallRequest }) =>
      updateCall(callId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calls'] })
      queryClient.invalidateQueries({ queryKey: ['call', variables.callId] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}

export const useDeleteCall = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (callId: string) => deleteCall(callId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}

