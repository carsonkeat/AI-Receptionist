/**
 * Form validation helpers
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validateRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0
}

/**
 * Validate UUID format (v4)
 * Matches standard UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * Also handles potential edge cases like whitespace, quotes, or encoding issues
 */
export const isValidUUID = (value: string | null | undefined): boolean => {
  if (!value || typeof value !== 'string') {
    if (__DEV__) {
      console.warn('[UUID Validation] Invalid input:', { value, type: typeof value })
    }
    return false
  }
  
  // Trim and remove any surrounding quotes that might have been added
  const trimmed = value.trim().replace(/^["']|["']$/g, '')
  
  // Check if empty after trimming
  if (!trimmed) {
    if (__DEV__) {
      console.warn('[UUID Validation] Empty value after trimming')
    }
    return false
  }
  
  // Standard UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const isValid = uuidRegex.test(trimmed)
  
  if (__DEV__ && !isValid) {
    console.warn('[UUID Validation] Invalid UUID format:', {
      original: value,
      trimmed,
      length: trimmed.length,
      firstChar: trimmed[0],
      lastChar: trimmed[trimmed.length - 1],
    })
  }
  
  return isValid
}

