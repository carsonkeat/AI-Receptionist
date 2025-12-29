/**
 * Account screen
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuthContext } from '@/context/AuthContext'
import { useProfile, useUserAssistantId, useUpdateUserAssistantId } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase/client'
import { clearCredentials } from '@/lib/utils/credentials'
import { isValidUUID } from '@/lib/utils/validation'

export default function AccountScreen() {
  const router = useRouter()
  const { user, profile } = useAuthContext()
  const assistantId = useUserAssistantId()
  const updateAssistantId = useUpdateUserAssistantId()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [inputAssistantId, setInputAssistantId] = useState('')

  const handleSaveAssistantId = async () => {
    const trimmedId = inputAssistantId.trim()
    
    if (!trimmedId) {
      Alert.alert('Error', 'Please enter an Assistant ID')
      return
    }

    if (!isValidUUID(trimmedId)) {
      Alert.alert('Invalid Format', 'Assistant ID must be a valid UUID format (e.g., xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)')
      return
    }

    try {
      await updateAssistantId.mutateAsync(trimmedId)
      Alert.alert('Success', 'Assistant ID has been saved successfully!')
      setInputAssistantId('')
    } catch (error) {
      console.error('Error saving assistant ID:', error)
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save Assistant ID. Please try again.')
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      // Clear stored credentials
      await clearCredentials()
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Navigate to welcome screen (initial sign in/sign up page)
      router.replace('/(auth)/welcome')
    } catch (error) {
      console.error('Sign out error:', error)
      // Navigate anyway even if there's an error
      router.replace('/(auth)/welcome')
    } finally {
      setIsSigningOut(false)
    }
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || 'N/A'}</Text>

            {profile && (
              <>
                <Text style={styles.label}>Account ID</Text>
                <Text style={styles.value}>{profile.account_id}</Text>
              </>
            )}

            <Text style={styles.label}>Assistant ID</Text>
            <Text style={styles.value}>{assistantId || 'Not assigned'}</Text>
          </View>

          {/* Assistant ID Setup Section - Only show if not assigned */}
          {!assistantId && (
            <View style={styles.setupCard}>
              <View style={styles.setupHeader}>
                <MaterialCommunityIcons name="link-plus" size={24} color="#FFFFFF" />
                <Text style={styles.setupTitle}>Set Up Assistant ID</Text>
              </View>
              <Text style={styles.setupDescription}>
                Enter your Assistant ID to enable receptionist features and start managing calls.
              </Text>
              
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Assistant ID (UUID)"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={inputAssistantId}
                  onChangeText={setInputAssistantId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, updateAssistantId.isPending && styles.buttonDisabled]}
                onPress={handleSaveAssistantId}
                disabled={updateAssistantId.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {updateAssistantId.isPending ? 'Saving...' : 'Save Assistant ID'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.button, isSigningOut && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            <Text style={styles.buttonText}>
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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
  button: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  setupCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  setupDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

