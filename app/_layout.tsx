/**
 * Root layout
 */

import { Slot } from 'expo-router'
import { AppProviders } from '@/context'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <AppProviders>
      <PaperProvider>
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </PaperProvider>
    </AppProviders>
  )
}

