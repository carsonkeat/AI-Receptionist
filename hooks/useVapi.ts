/**
 * VAPI hooks for managing assistants and calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createVapiAssistant,
  getVapiAssistant,
  updateVapiAssistant,
  listVapiAssistants,
  createVapiPhoneNumber,
  getVapiPhoneNumber,
  updateVapiPhoneNumber,
  getVapiCall,
  listVapiCalls,
  createVapiCall,
} from '@/lib/api/vapi'
import type { VapiAssistant, VapiPhoneNumber, VapiCall } from '@/lib/api/vapi'

/**
 * Get VAPI assistant by ID
 */
export const useVapiAssistant = (assistantId: string | undefined) => {
  return useQuery({
    queryKey: ['vapi-assistant', assistantId],
    queryFn: () => getVapiAssistant(assistantId!),
    enabled: !!assistantId,
  })
}

/**
 * List all VAPI assistants
 */
export const useVapiAssistants = () => {
  return useQuery({
    queryKey: ['vapi-assistants'],
    queryFn: listVapiAssistants,
  })
}

/**
 * Create VAPI assistant mutation
 */
export const useCreateVapiAssistant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assistant: Partial<VapiAssistant>) => createVapiAssistant(assistant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vapi-assistants'] })
    },
  })
}

/**
 * Update VAPI assistant mutation
 */
export const useUpdateVapiAssistant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assistantId, updates }: { assistantId: string; updates: Partial<VapiAssistant> }) =>
      updateVapiAssistant(assistantId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vapi-assistants'] })
      queryClient.invalidateQueries({ queryKey: ['vapi-assistant', variables.assistantId] })
    },
  })
}

/**
 * Get VAPI phone number
 */
export const useVapiPhoneNumber = (phoneNumberId: string | undefined) => {
  return useQuery({
    queryKey: ['vapi-phone-number', phoneNumberId],
    queryFn: () => getVapiPhoneNumber(phoneNumberId!),
    enabled: !!phoneNumberId,
  })
}

/**
 * Create VAPI phone number mutation
 */
export const useCreateVapiPhoneNumber = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (phoneNumber: Partial<VapiPhoneNumber>) => createVapiPhoneNumber(phoneNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vapi-phone-numbers'] })
    },
  })
}

/**
 * Update VAPI phone number mutation
 */
export const useUpdateVapiPhoneNumber = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ phoneNumberId, updates }: { phoneNumberId: string; updates: Partial<VapiPhoneNumber> }) =>
      updateVapiPhoneNumber(phoneNumberId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vapi-phone-numbers'] })
      queryClient.invalidateQueries({ queryKey: ['vapi-phone-number', variables.phoneNumberId] })
    },
  })
}

/**
 * Get VAPI call by ID
 */
export const useVapiCall = (callId: string | undefined) => {
  return useQuery({
    queryKey: ['vapi-call', callId],
    queryFn: () => getVapiCall(callId!),
    enabled: !!callId,
  })
}

/**
 * List VAPI calls
 */
export const useVapiCalls = (filters?: {
  id?: string
  assistantId?: string
  phoneNumberId?: string
  limit?: number
  createdAtGt?: string
  createdAtLt?: string
  createdAtGe?: string
  createdAtLe?: string
  updatedAtGt?: string
  updatedAtLt?: string
  updatedAtGe?: string
  updatedAtLe?: string
}) => {
  return useQuery({
    queryKey: ['vapi-calls', filters],
    queryFn: () => listVapiCalls(filters),
  })
}

/**
 * Create VAPI call mutation (for outbound calls)
 */
export const useCreateVapiCall = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (call: { assistantId: string; customer?: { number: string }; phoneNumberId?: string }) =>
      createVapiCall(call),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vapi-calls'] })
    },
  })
}

