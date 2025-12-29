/**
 * Account screen
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthContext } from '@/context/AuthContext'
import { LoadingSpinner } from '@/components/common'

export default function AccountScreen() {
  const { user, profile, signOut, isSigningOut } = useAuthContext()

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          signOut()
        },
      },
    ])
  }

  if (isSigningOut) {
    return <LoadingSpinner />
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
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
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
})

