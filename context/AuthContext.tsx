/**
 * Authentication context provider
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types/database'

interface AuthContextType {
  user: { id: string; email: string } | null
  profile: Profile | undefined
  isLoading: boolean
  signIn: (args: { email: string; password: string }) => void
  signUp: (args: { email: string; password: string }) => void
  signOut: () => void
  isSigningIn: boolean
  isSigningUp: boolean
  isSigningOut: boolean
  signInError: Error | null
  signUpError: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

