/**
 * Dashboard screen - Updated to use VAPI API data
 */

import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, StatusBar, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useVapiCalls } from '@/hooks/useVapi'
import { useAuthContext } from '@/context/AuthContext'
import { useReceptionists } from '@/hooks/useReceptionist'
import { LoadingSpinner, ErrorMessage } from '@/components/common'
import { formatCurrency } from '@/lib/utils/currency'

export default function DashboardScreen() {
  const { user } = useAuthContext()
  const { data: receptionists } = useReceptionists()
  const [refreshing, setRefreshing] = useState(false)

  // Get Trusted KC Receptionist and its assistant ID
  const trustedKCReceptionist = useMemo(() => {
    return receptionists?.find(r => 
      r.name?.toLowerCase().includes('trusted') && 
      r.name?.toLowerCase().includes('kc')
    ) || receptionists?.[0]
  }, [receptionists])

  const assistantId = trustedKCReceptionist?.vapi_assistant_id

  // Fetch VAPI calls filtered by Trusted KC Assistant ID
  const { data: callsData, isLoading, error, refetch } = useVapiCalls(
    assistantId ? { assistantId, limit: 1000 } : undefined
  )

  const calls = callsData || []

  // Calculate metrics from VAPI calls
  const metrics = useMemo(() => {
    if (!calls || calls.length === 0) {
      return {
        total_minutes_used: 0,
        total_cost: 0,
        cost_per_minute: 0,
        total_calls: 0,
      }
    }

    let totalMinutes = 0
    let totalCost = 0
    let totalCalls = 0

    calls.forEach((call) => {
      // Calculate duration in minutes
      if (call.startedAt && call.endedAt) {
        const start = new Date(call.startedAt).getTime()
        const end = new Date(call.endedAt).getTime()
        const durationSeconds = Math.floor((end - start) / 1000)
        const durationMinutes = durationSeconds / 60
        totalMinutes += durationMinutes
      }

      // Get cost from call
      const callCost = call.cost || call.costBreakdown?.total || 0
      totalCost += callCost

      // Count call
      totalCalls++
    })

    const costPerMinute = totalMinutes > 0 ? totalCost / totalMinutes : 0

    return {
      total_minutes_used: totalMinutes,
      total_cost: totalCost,
      cost_per_minute: costPerMinute,
      total_calls: totalCalls,
    }
  }, [calls])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (err) {
      console.error('Error refreshing metrics:', err)
    }
    setRefreshing(false)
  }, [refetch])

  // Calculate remaining budget (if you have a budget, otherwise show total cost)
  const totalCost = metrics.total_cost
  const totalCalls = metrics.total_calls
  const totalMinutes = metrics.total_minutes_used.toFixed(1)

  // Get receptionist phone number
  const receptionist = receptionists?.[0]
  const phoneNumber = receptionist?.phone_number

  // Handle calling receptionist
  const handleCallReceptionist = useCallback(async () => {
    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'Receptionist phone number is not configured.')
      return
    }

    const url = `tel:${phoneNumber}`
    const supported = await Linking.canOpenURL(url)
    
    if (supported) {
      await Linking.openURL(url)
    } else {
      Alert.alert('Error', 'Unable to make phone calls on this device.')
    }
  }, [phoneNumber])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#7A9CC6', '#8BA5C4', '#9A94B8', '#8B8BA3', '#A09CB2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>AI Receptionist</Text>
          </View>

          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage error={error} onRetry={() => refetch()} />
          ) : !assistantId ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#FFFFFF" />
              <Text style={styles.errorText}>Trusted KC Receptionist not configured</Text>
              <Text style={styles.errorSubtext}>Please configure a receptionist with a VAPI Assistant ID</Text>
            </View>
          ) : (
            <>
              {/* Main Metrics Section */}
              <View style={styles.metricsContainer}>
                {/* Total Calls - Left */}
                <View style={styles.sideMetric}>
                  <Text style={styles.sideValue}>{totalCalls}</Text>
                  <Text style={styles.sideLabel}>CALLS</Text>
                </View>

                {/* Total Cost - Center (Main Focus) */}
                <View style={styles.centerCircle}>
                  <View style={styles.circleOuter}>
                    <View style={styles.circleInner}>
                      <Text style={styles.centerValue}>{formatCurrency(totalCost)}</Text>
                      <Text style={styles.centerLabel}>TOTAL COST</Text>
                    </View>
                  </View>
                </View>

                {/* Total Minutes - Right */}
                <View style={styles.sideMetric}>
                  <Text style={styles.sideValue}>{totalMinutes}</Text>
                  <Text style={styles.sideLabel}>MINUTES</Text>
                </View>
              </View>

              {/* Secondary Metrics Card */}
              <View style={styles.secondaryCard}>
                <View style={styles.secondaryRow}>
                  <Text style={styles.secondaryLabel}>Cost per Minute</Text>
                  <Text style={styles.secondaryValue}>
                    {formatCurrency(metrics.cost_per_minute)}
                  </Text>
                </View>
                <View style={styles.secondaryRow}>
                  <Text style={styles.secondaryLabel}>Avg. Call Duration</Text>
                  <Text style={styles.secondaryValue}>
                    {totalCalls > 0
                      ? (metrics.total_minutes_used / totalCalls).toFixed(2)
                      : '0.00'}{' '}
                    min
                  </Text>
                </View>
              </View>

              {/* Call Receptionist Button */}
              {phoneNumber && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCallReceptionist}
                  activeOpacity={0.8}
                >
                  <View style={styles.callButtonContent}>
                    <MaterialCommunityIcons name="phone" size={24} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>Call Receptionist</Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
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
    paddingBottom: 32,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
    minHeight: 200,
  },
  sideMetric: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 120,
  },
  sideValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sideLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  centerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.5,
  },
  circleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  centerLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  secondaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  secondaryValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  callButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  callButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  callButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    marginTop: 100,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
})

