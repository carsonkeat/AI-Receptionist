/**
 * Receptionist overview screen
 */

import React from 'react'
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useReceptionists } from '@/hooks/useReceptionist'
import { LoadingSpinner, ErrorMessage } from '@/components/common'

export default function ReceptionistScreen() {
  const router = useRouter()
  const { data: receptionists, isLoading, error, refetch } = useReceptionists()
  const receptionist = receptionists?.[0]

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => refetch()} />
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#7A9CC6', '#8BA5C4', '#9A94B8', '#8B8BA3', '#A09CB2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Receptionist</Text>
          {receptionist?.vapi_assistant_id && (
            <TouchableOpacity
              style={styles.advancedButton}
              onPress={() => router.push('/receptionist/advanced')}
            >
              <MaterialCommunityIcons name="cog" size={20} color="#FFFFFF" />
              <Text style={styles.advancedButtonText}>Advanced</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {receptionist ? (
            <View style={styles.card}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{receptionist.name}</Text>

              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {receptionist.status.charAt(0).toUpperCase() + receptionist.status.slice(1)}
              </Text>

              {receptionist.phone_number && (
                <>
                  <Text style={styles.label}>Phone Number</Text>
                  <Text style={styles.value}>{receptionist.phone_number}</Text>
                </>
              )}

              {receptionist.vapi_assistant_id && (
                <>
                  <Text style={styles.label}>VAPI Assistant ID</Text>
                  <Text style={styles.value}>{receptionist.vapi_assistant_id}</Text>
                </>
              )}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No receptionist configured</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  advancedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  label: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
})

