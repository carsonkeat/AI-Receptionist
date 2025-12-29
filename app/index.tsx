/**
 * Entry point - redirects to welcome or dashboard based on auth state
 */

import { useEffect } from 'react'
import { useRouter, useRootNavigationState } from 'expo-router'
import { useAuthContext } from '@/context/AuthContext'
import { LoadingSpinner } from '@/components/common'

export default function Index() {
  const router = useRouter()
  const navigationState = useRootNavigationState()
  const { user, isLoading } = useAuthContext()

  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key) {
      return
    }

    // Wait for auth state to load
    if (isLoading) {
      return
    }

    // Navigate based on auth state
    if (user) {
      router.replace('/(tabs)/dashboard')
    } else {
      router.replace('/(auth)/welcome')
    }
  }, [navigationState?.key, user, isLoading, router])

  // Show loading while navigation is initializing or auth is loading
  if (!navigationState?.key || isLoading) {
    return <LoadingSpinner />
  }

  return null
}
