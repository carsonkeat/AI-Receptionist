/**
 * User profile operations hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentProfile, updateProfile } from '@/lib/api/profiles'
import type { Profile } from '@/types/database'

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getCurrentProfile,
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<Profile> }) =>
      updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

