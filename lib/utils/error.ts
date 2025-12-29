/**
 * Error handling utilities
 */

import type { ApiError } from '@/types/api'

export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    // Handle common Supabase error messages
    const message = error.message
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.'
    }
    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Please log in instead.'
    }
    if (message.includes('Email rate limit exceeded')) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (message.includes('Password should be at least')) {
      return 'Password is too short. Please use at least 6 characters.'
    }
    if (message.includes('Supabase is not configured')) {
      return 'Authentication is not configured. Please contact support.'
    }
    return message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    try {
      // Use hasOwnProperty to safely check for message property
      if (Object.prototype.hasOwnProperty.call(error, 'message')) {
        const message = (error as { message: unknown }).message
        if (message != null) {
          return String(message)
        }
      }
    } catch {
      // If property check fails, fall through to default message
    }
  }

  return 'An unexpected error occurred'
}

export const isApiError = (error: unknown): error is ApiError => {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  
  try {
    // Use hasOwnProperty to safely check for message property
    if (!Object.prototype.hasOwnProperty.call(error, 'message')) {
      return false
    }
    
    return typeof (error as { message: unknown }).message === 'string'
  } catch {
    // If property check fails, it's not an ApiError
    return false
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message
  }

  return formatError(error)
}

