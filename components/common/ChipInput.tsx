/**
 * ChipInput - Reusable chip-based input component for lists
 */

import React from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface ChipInputProps {
  items: string[]
  onAdd: (item: string) => void
  onRemove: (index: number) => void
  placeholder?: string
  chipColor?: string
  showRemoveButton?: boolean
}

export function ChipInput({
  items,
  onAdd,
  onRemove,
  placeholder = 'Add item...',
  chipColor = '#00D4AA',
  showRemoveButton = true,
}: ChipInputProps) {
  const [inputValue, setInputValue] = React.useState('')

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim())
      setInputValue('')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.chipContainer}>
        {items.map((item, index) => (
          <View key={index} style={[styles.chip, { backgroundColor: chipColor }]}>
            <Text style={styles.chipText}>{item}</Text>
            {showRemoveButton && (
              <TouchableOpacity onPress={() => onRemove(index)} style={styles.chipRemove}>
                <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={styles.addChipContainer}>
          <TextInput
            style={styles.addChipInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={[styles.addChipButton, { backgroundColor: chipColor }]} onPress={handleAdd}>
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addChipContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
  },
  addChipInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  addChipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

