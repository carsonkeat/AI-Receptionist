/**
 * Inline audio player component for call recordings
 */

import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Audio } from 'expo-av'

interface AudioPlayerProps {
  recordingUrl: string
  duration?: number // Optional: duration in seconds
  theme?: 'light' | 'gradient' // Theme for styling
}

export function AudioPlayer({ recordingUrl, duration, theme = 'light' }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [playbackDuration, setPlaybackDuration] = useState(duration || 0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [volume, setVolume] = useState(1.0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const progressBarRef = useRef<View>(null)
  const [progressBarWidth, setProgressBarWidth] = useState(0)
  const [volumeBarWidth, setVolumeBarWidth] = useState(100)

  // Playback rates: 0.5x, 1x, 1.5x, 2x
  const playbackRates = [0.5, 1.0, 1.5, 2.0]

  useEffect(() => {
    return () => {
      // Cleanup: unload sound when component unmounts
      if (sound) {
        sound.unloadAsync().catch(console.error)
      }
    }
  }, [sound])

  const loadSound = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load the audio file
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUrl },
        { shouldPlay: false }
      )

      // Get duration
      const status = await newSound.getStatusAsync()
      if (status.isLoaded && status.durationMillis !== undefined) {
        setPlaybackDuration(status.durationMillis / 1000)
      }

      // Set up status update listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying)
          if (status.positionMillis !== undefined) {
            setPlaybackPosition(status.positionMillis / 1000)
          }
          if (status.durationMillis !== undefined) {
            setPlaybackDuration(status.durationMillis / 1000)
          }
          
          if (status.didJustFinish) {
            setIsPlaying(false)
            setPlaybackPosition(0)
          }
        }
      })

      setSound(newSound)
    } catch (err) {
      console.error('Error loading audio:', err)
      setError('Failed to load recording')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlayback = async () => {
    try {
      if (!sound) {
        await loadSound()
        return
      }

      const status = await sound.getStatusAsync()
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync()
        } else {
          await sound.playAsync()
        }
      }
    } catch (err) {
      console.error('Error toggling playback:', err)
      setError('Playback error')
    }
  }

  const changePlaybackRate = async () => {
    if (!sound) return

    const currentIndex = playbackRates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % playbackRates.length
    const nextRate = playbackRates[nextIndex]
    
    try {
      await sound.setRateAsync(nextRate, true)
      setPlaybackRate(nextRate)
    } catch (err) {
      console.error('Error changing playback rate:', err)
    }
  }

  const seekTo = async (position: number) => {
    if (!sound) return

    try {
      await sound.setPositionAsync(position * 1000)
      setPlaybackPosition(position)
    } catch (err) {
      console.error('Error seeking:', err)
    }
  }

  const changeVolume = async (newVolume: number) => {
    if (!sound) return

    try {
      await sound.setVolumeAsync(newVolume)
      setVolume(newVolume)
    } catch (err) {
      console.error('Error changing volume:', err)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = () => {
    // In a real app, you'd use expo-file-system to download
    // For now, just open the URL
    Linking.openURL(recordingUrl).catch(console.error)
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    )
  }

  const containerStyle = theme === 'gradient' ? styles.containerGradient : styles.container

  return (
    <View style={containerStyle}>
      {/* Main Player Controls */}
      <View style={styles.playerContainer}>
        <TouchableOpacity
          style={theme === 'gradient' ? styles.playButtonGradient : styles.playButton}
          onPress={togglePlayback}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme === 'gradient' ? '#FFFFFF' : '#007AFF'} />
          ) : (
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color={theme === 'gradient' ? '#FFFFFF' : '#007AFF'}
            />
          )}
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={theme === 'gradient' ? styles.timeTextGradient : styles.timeText}>
            {formatTime(playbackPosition)}
          </Text>
          <View
            ref={progressBarRef}
            style={styles.progressBarContainer}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout
              setProgressBarWidth(width)
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ flex: 1 }}
              onPress={(e) => {
                const { locationX } = e.nativeEvent
                if (progressBarWidth > 0 && playbackDuration > 0) {
                  const percentage = Math.max(0, Math.min(1, locationX / progressBarWidth))
                  const newPosition = percentage * playbackDuration
                  seekTo(newPosition)
                }
              }}
            >
            <View style={theme === 'gradient' ? styles.progressBarGradient : styles.progressBar}>
              <View
                style={[
                  theme === 'gradient' ? styles.progressBarFillGradient : styles.progressBarFill,
                  { width: playbackDuration > 0 ? `${(playbackPosition / playbackDuration) * 100}%` : '0%' },
                ]}
              />
            </View>
            </TouchableOpacity>
          </View>
          <Text style={theme === 'gradient' ? styles.timeTextGradient : styles.timeText}>
            {formatTime(playbackDuration)}
          </Text>
        </View>

        {/* Speed Control */}
        <TouchableOpacity
          style={theme === 'gradient' ? styles.speedButtonGradient : styles.speedButton}
          onPress={changePlaybackRate}
        >
          <Text style={theme === 'gradient' ? styles.speedTextGradient : styles.speedText}>
            {playbackRate}x
          </Text>
        </TouchableOpacity>
      </View>

      {/* Volume Control */}
      <View style={styles.volumeContainer}>
        <MaterialCommunityIcons
          name={volume === 0 ? 'volume-mute' : volume < 0.5 ? 'volume-low' : 'volume-high'}
          size={18}
          color={theme === 'gradient' ? 'rgba(255, 255, 255, 0.8)' : '#666666'}
        />
        <View
          style={styles.volumeBarContainer}
          onLayout={(e) => {
            const { width } = e.nativeEvent.layout
            if (width > 0) {
              setVolumeBarWidth(width)
            }
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={(e) => {
              const { locationX } = e.nativeEvent
              if (volumeBarWidth > 0) {
                const newVolume = Math.max(0, Math.min(1, locationX / volumeBarWidth))
                changeVolume(newVolume)
              }
            }}
          >
          <View style={theme === 'gradient' ? styles.volumeBarGradient : styles.volumeBar}>
            <View
              style={[
                theme === 'gradient' ? styles.volumeBarFillGradient : styles.volumeBarFill,
                { width: `${volume * 100}%` },
              ]}
            />
          </View>
          </TouchableOpacity>
        </View>
        <Text style={theme === 'gradient' ? styles.volumeTextGradient : styles.volumeText}>
          {Math.round(volume * 100)}%
        </Text>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity
          style={theme === 'gradient' ? styles.controlButtonGradient : styles.controlButton}
          onPress={handleDownload}
        >
          <MaterialCommunityIcons
            name="download"
            size={18}
            color={theme === 'gradient' ? '#FFFFFF' : '#666666'}
          />
          <Text style={theme === 'gradient' ? styles.controlButtonTextGradient : styles.controlButtonText}>
            Download
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  containerGradient: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
    minWidth: 40,
    textAlign: 'center',
  },
  timeTextGradient: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    minWidth: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarGradient: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressBarFillGradient: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  speedButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  speedTextGradient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryControls: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  controlButtonTextGradient: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  volumeBarContainer: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  volumeBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeBarGradient: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  volumeBarFillGradient: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  volumeText: {
    fontSize: 12,
    color: '#666666',
    minWidth: 35,
    textAlign: 'right',
  },
  volumeTextGradient: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    minWidth: 35,
    textAlign: 'right',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
  },
})


