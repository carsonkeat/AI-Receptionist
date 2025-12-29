/**
 * Secure credential storage utilities
 * Uses SecureStore for secure storage of credentials
 */

import * as SecureStore from 'expo-secure-store'

const REMEMBER_ME_KEY = 'remember_me_enabled'
const STORED_EMAIL_KEY = 'stored_email'
const STORED_PASSWORD_KEY = 'stored_password' // Securely stored when remember me is enabled

/**
 * Store credentials when "Remember Me" is checked
 */
export async function storeCredentials(email: string, password: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true')
    await SecureStore.setItemAsync(STORED_EMAIL_KEY, email)
    await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password)
  } catch (error) {
    console.error('Error storing credentials:', error)
  }
}

/**
 * Clear stored credentials (e.g., on logout or when unchecking "Remember Me")
 */
export async function clearCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REMEMBER_ME_KEY)
    await SecureStore.deleteItemAsync(STORED_EMAIL_KEY)
    await SecureStore.deleteItemAsync(STORED_PASSWORD_KEY)
  } catch (error) {
    console.error('Error clearing credentials:', error)
  }
}

/**
 * Get stored email (for pre-filling login form)
 */
export async function getStoredEmail(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORED_EMAIL_KEY)
  } catch (error) {
    console.error('Error getting stored email:', error)
    return null
  }
}

/**
 * Get stored credentials if "Remember Me" was enabled
 */
export async function getStoredCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const rememberMe = await SecureStore.getItemAsync(REMEMBER_ME_KEY)
    if (rememberMe !== 'true') {
      return null
    }

    const email = await SecureStore.getItemAsync(STORED_EMAIL_KEY)
    const password = await SecureStore.getItemAsync(STORED_PASSWORD_KEY)

    if (email && password) {
      return { email, password }
    }

    return null
  } catch (error) {
    console.error('Error getting stored credentials:', error)
    return null
  }
}

/**
 * Check if "Remember Me" is enabled
 */
export async function isRememberMeEnabled(): Promise<boolean> {
  try {
    const rememberMe = await SecureStore.getItemAsync(REMEMBER_ME_KEY)
    return rememberMe === 'true'
  } catch (error) {
    console.error('Error checking remember me status:', error)
    return false
  }
}

