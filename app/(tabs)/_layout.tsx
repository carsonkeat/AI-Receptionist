/**
 * Tabs layout configuration
 */

import { Tabs } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/context/ThemeContext'
import { colors as defaultColors } from '@/constants/colors'

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  
  let themeContext
  try {
    themeContext = useTheme()
  } catch {
    // Theme context not available, use defaults
  }
  
  // Ensure we always have valid color values
  const colors = themeContext?.colors || defaultColors
  const primary = colors?.primary || defaultColors.primary
  const textSecondary = colors?.textSecondary || defaultColors.textSecondary

  // Calculate tab bar height including safe area bottom inset
  const tabBarHeight = 60 + insets.bottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.2)', // Matches total cost bubble appearance
          borderTopColor: 'rgba(255, 255, 255, 0.3)',
          borderTopWidth: 3,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
          zIndex: 1000, // Ensure tab bar is above content
          overflow: 'hidden', // Prevents content from showing through
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: '#FFFFFF',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)', // Matches total cost bubble appearance
            borderTopColor: 'rgba(255, 255, 255, 0.3)',
            borderTopWidth: 3,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
            position: 'absolute',
            zIndex: 1000, // Ensure tab bar is above content
            overflow: 'hidden', // Prevents content from showing through
          },
        }}
      />
      {/* Calls tab - Hidden for now (may revisit later) */}
      <Tabs.Screen
        name="calls"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="calls-test"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="phone-in-talk" size={size} color={color} />
          ),
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)', // Matches total cost bubble appearance
            borderTopColor: 'rgba(255, 255, 255, 0.3)',
            borderTopWidth: 3,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
            position: 'absolute',
            zIndex: 1000, // Ensure tab bar is above content
            overflow: 'hidden', // Prevents content from showing through
          },
        }}
      />
      <Tabs.Screen
        name="receptionist"
        options={{
          title: 'Receptionist',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot" size={size} color={color} />
          ),
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)', // Matches total cost bubble appearance
            borderTopColor: 'rgba(255, 255, 255, 0.3)',
            borderTopWidth: 3,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
            position: 'absolute',
            zIndex: 1000, // Ensure tab bar is above content
            overflow: 'hidden', // Prevents content from showing through
          },
        }}
      />
      <Tabs.Screen
        name="receptionist/advanced"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="receptionist/advanced/update-assistant"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)', // Matches total cost bubble appearance
            borderTopColor: 'rgba(255, 255, 255, 0.3)',
            borderTopWidth: 3,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
            position: 'absolute',
            zIndex: 1000, // Ensure tab bar is above content
            overflow: 'hidden', // Prevents content from showing through
          },
        }}
      />
    </Tabs>
  )
}

