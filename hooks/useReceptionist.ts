/**
 * Receptionist data and operations hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReceptionists, getReceptionist, createReceptionist, updateReceptionist } from '@/lib/api/receptionists'
import type { CreateReceptionistRequest, UpdateReceptionistRequest } from '@/types/api'

export const useReceptionists = () => {
  return useQuery({
    queryKey: ['receptionists'],
    queryFn: getReceptionists,
  })
}

export const useReceptionist = (receptionistId: string | undefined) => {
  return useQuery({
    queryKey: ['receptionist', receptionistId],
    queryFn: () => getReceptionist(receptionistId!),
    enabled: !!receptionistId,
  })
}

export const useCreateReceptionist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (receptionist: CreateReceptionistRequest) => createReceptionist(receptionist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] })
    },
  })
}

export const useUpdateReceptionist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ receptionistId, updates }: { receptionistId: string; updates: UpdateReceptionistRequest }) =>
      updateReceptionist(receptionistId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receptionists'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist', variables.receptionistId] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}

