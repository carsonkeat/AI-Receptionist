/**
 * Slider - Reusable slider component with touch handling
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, PanResponder } from 'react-native'

interface SliderProps {
  value: number
  onValueChange: (value: number) => void
  minimumValue: number
  maximumValue: number
  step?: number
  unit?: string
  formatValue?: (value: number) => string
}

export function Slider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 0.1,
  unit = '',
  formatValue,
}: SliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0)

  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (sliderWidth > 0) {
        const newPercentage = Math.max(0, Math.min(100, (gestureState.moveX / sliderWidth) * 100))
        const newValue = minimumValue + (newPercentage / 100) * (maximumValue - minimumValue)
        const steppedValue = Math.round(newValue / step) * step
        onValueChange(Math.max(minimumValue, Math.min(maximumValue, steppedValue)))
      }
    },
  })

  const displayValue = formatValue ? formatValue(value) : value.toFixed(step < 1 ? 1 : 0)

  return (
    <View style={styles.sliderContainer}>
      <View
        style={styles.sliderTrack}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderFill, { width: `${percentage}%` }]} />
        <View style={[styles.sliderThumb, { left: `${percentage}%` }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>
          {minimumValue}
          {unit ? ` (${unit})` : ''}
        </Text>
        <Text style={styles.sliderLabel}>
          {maximumValue}
          {unit ? ` (${unit})` : ''}
        </Text>
      </View>
      <View style={styles.sliderValueBox}>
        <Text style={styles.sliderValue}>{displayValue}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  sliderContainer: {
    marginTop: 12,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    position: 'relative',
    marginBottom: 8,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#00D4AA',
    borderRadius: 4,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00D4AA',
    position: 'absolute',
    top: -6,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sliderValueBox: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 212, 170, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
})

