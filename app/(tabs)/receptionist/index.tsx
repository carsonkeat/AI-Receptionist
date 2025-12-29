/**
 * Receptionist overview screen - Advanced Features
 */

import React from 'react'
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useProfile, useUserAssistantId } from '@/hooks/useProfile'
import { LoadingSpinner, ErrorMessage } from '@/components/common'

export default function ReceptionistScreen() {
  const router = useRouter()
  const { data: profile, isLoading, error, refetch } = useProfile()
  const assistantId = useUserAssistantId()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => refetch()} />
  }

  if (!assistantId) {
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
          </View>
          <View style={styles.empty}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.emptyText}>No Assistant ID found</Text>
            <Text style={styles.emptySubtext}>Please link an assistant first</Text>
          </View>
        </LinearGradient>
      </View>
    )
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
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assistant Management</Text>
            <Text style={styles.cardDescription}>Configure and update your assistant settings</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/receptionist/advanced/update-assistant')}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Update Assistant</Text>
                  <Text style={styles.menuItemSubtitle}>Modify assistant configuration, model, voice, and more</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Billing & Cost Controls</Text>
            <Text style={styles.cardDescription}>Manage spend limits, budgets, alerts, and cost controls</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/receptionist/advanced/billing-costs')}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="credit-card-outline" size={24} color="#FFFFFF" />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Billing & Cost Controls</Text>
                  <Text style={styles.menuItemSubtitle}>Set limits, budgets, alerts, and pricing controls</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Behavior Rules</Text>
            <Text style={styles.cardDescription}>Configure intents, escalation, compliance, and behavior rules</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/receptionist/advanced/behavior-rules')}
            >
              <View style={styles.menuItemLeft}>
                <MaterialCommunityIcons name="shield-check-outline" size={24} color="#FFFFFF" />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>Behavior Rules</Text>
                  <Text style={styles.menuItemSubtitle}>Set intents, escalation, compliance, and call rules</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.infoText}>
              Assistant ID: {assistantId || 'Not assigned'}
            </Text>
          </View>
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
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
})

