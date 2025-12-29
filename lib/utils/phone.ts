/**
 * Phone number formatting utilities
 */

export const formatPhoneNumber = (phone: string): string => {
  // Handle Unknown or empty cases
  if (!phone || phone === 'Unknown' || phone.toLowerCase() === 'unknown') {
    return 'Unknown'
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // If cleaning results in empty, return original
  if (!cleaned) {
    return phone
  }

  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Format as +X (XXX) XXX-XXXX for international
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // Return as-is if doesn't match expected format
  return phone
}

export const maskPhoneNumber = (phone: string): string => {
  // Handle Unknown or empty cases
  if (!phone || phone === 'Unknown' || phone.toLowerCase() === 'unknown') {
    return 'Unknown'
  }
  
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length >= 4) {
    return `***-***-${cleaned.slice(-4)}`
  }
  // If we have a phone but it's too short, return as-is
  return phone
}

