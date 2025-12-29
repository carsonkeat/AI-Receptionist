/**
 * ExpandableSection - Reusable expandable/collapsible section component
 */

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface ExpandableSectionProps {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function ExpandableSection({ title, expanded, onToggle, children }: ExpandableSectionProps) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionContent: {
    padding: 20,
    paddingTop: 0,
  },
})

