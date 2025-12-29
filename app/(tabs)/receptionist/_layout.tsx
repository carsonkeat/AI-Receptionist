/**
 * Receptionist stack layout - handles nested routes (advanced features)
 * This layout ensures nested routes don't appear as separate tabs
 */

import { Stack } from 'expo-router'

export default function ReceptionistLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Receptionist',
        }}
      />
      <Stack.Screen 
        name="advanced" 
        options={{
          title: 'Advanced',
        }}
      />
      <Stack.Screen 
        name="advanced/update-assistant" 
        options={{
          title: 'Update Assistant',
        }}
      />
      <Stack.Screen 
        name="advanced/billing-costs" 
        options={{
          title: 'Billing & Cost Controls',
        }}
      />
      <Stack.Screen 
        name="advanced/behavior-rules" 
        options={{
          title: 'Behavior Rules',
        }}
      />
    </Stack>
  )
}

