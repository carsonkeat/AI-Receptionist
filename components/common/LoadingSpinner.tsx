/**
 * Loading spinner component
 */

import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

export const LoadingSpinner = () => {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
})

