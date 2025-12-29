/**
 * Error message component
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { formatError } from '@/lib/utils/error'

interface ErrorMessageProps {
  error: unknown
  onRetry?: () => void
}

export const ErrorMessage = ({ error, onRetry }: ErrorMessageProps) => {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.message, { color: colors.error }]}>{formatError(error)}</Text>
      {onRetry && (
        <Text style={[styles.retry, { color: colors.primary }]} onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
  },
  retry: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
})

