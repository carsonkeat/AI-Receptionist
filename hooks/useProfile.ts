/**
 * User profile operations hook
 */

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentProfile, updateProfile } from '@/lib/api/profiles'
import { useAuth } from '@/hooks/useAuth'
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

/**
 * Get current user's assistant ID
 * Trims whitespace and validates the format
 */
export const useUserAssistantId = () => {
  const { data: profile } = useProfile()
  const rawAssistantId = profile?.vapi_assistant_id || null
  // Trim whitespace in case the database has leading/trailing spaces
  const assistantId = typeof rawAssistantId === 'string' ? rawAssistantId.trim() : rawAssistantId
  
  // Debug logging
  React.useEffect(() => {
    if (__DEV__) {
      console.log('[useUserAssistantId Debug] Profile data:', profile)
      console.log('[useUserAssistantId Debug] Raw assistantId from DB:', rawAssistantId)
      console.log('[useUserAssistantId Debug] Trimmed assistantId:', assistantId)
      console.log('[useUserAssistantId Debug] AssistantId type:', typeof assistantId)
      if (assistantId) {
        console.log('[useUserAssistantId Debug] AssistantId length:', assistantId.length)
        console.log('[useUserAssistantId Debug] AssistantId JSON:', JSON.stringify(assistantId))
        // Check for common issues
        if (assistantId !== rawAssistantId) {
          console.warn('[useUserAssistantId Debug] ⚠️ Whitespace detected and trimmed!')
        }
      }
    }
  }, [profile, assistantId, rawAssistantId])
  
  return assistantId || null
}

/**
 * Update current user's assistant ID
 */
export const useUpdateUserAssistantId = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (assistantId: string | null) => {
      if (!user) {
        throw new Error('User not authenticated')
      }
      return updateProfile(user.id, { vapi_assistant_id: assistantId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['vapi-assistant'] })
    },
  })
}

