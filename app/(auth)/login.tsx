/**
 * Login screen
 */

import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthContext } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { LoadingSpinner, ErrorMessage } from '@/components/common'
import { getStoredEmail, storeCredentials, clearCredentials, isRememberMeEnabled } from '@/lib/utils/credentials'

export default function LoginScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { signIn, isSigningIn, signInError } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Load stored email on mount
  useEffect(() => {
    const loadStoredEmail = async () => {
      try {
        const storedEmail = await getStoredEmail()
        const wasRememberMeEnabled = await isRememberMeEnabled()
        if (storedEmail) {
          setEmail(storedEmail)
          setRememberMe(wasRememberMeEnabled)
        }
      } catch (error) {
        console.error('Error loading stored email:', error)
      }
    }
    loadStoredEmail()
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    try {
      // Store credentials if "Remember Me" is checked
      if (rememberMe) {
        await storeCredentials(email, password)
      } else {
        // Clear stored credentials if "Remember Me" is unchecked
        await clearCredentials()
      }

      signIn({ email, password })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  if (isSigningIn) {
    return <LoadingSpinner />
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Log In</Text>

      {signInError && <ErrorMessage error={signInError} />}

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Remember Me Checkbox */}
      <TouchableOpacity
        style={styles.rememberMeContainer}
        onPress={() => setRememberMe(!rememberMe)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkbox,
          { borderColor: rememberMe ? colors.primary : colors.border },
          rememberMe && { backgroundColor: colors.primary }
        ]}>
          {rememberMe && (
            <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
          )}
        </View>
        <Text style={[styles.rememberMeText, { color: colors.text }]}>Remember Me</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleLogin}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/signup')}>
        <Text style={[styles.link, { color: colors.primary }]}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  link: {
    fontSize: 14,
    textAlign: 'center',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 14,
    fontWeight: '500',
  },
})

