/**
 * Update Assistant screen - comprehensive form for updating VAPI assistant
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useProfile, useUserAssistantId } from '@/hooks/useProfile'
import { useVapiAssistant, useUpdateVapiAssistant } from '@/hooks/useVapi'
import { LoadingSpinner, ErrorMessage, ExpandableSection, Slider } from '@/components/common'

export default function UpdateAssistantScreen() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const assistantId = useUserAssistantId()

  const { data: assistant, isLoading: isLoadingAssistant, error: assistantError } = useVapiAssistant(assistantId)
  const updateMutation = useUpdateVapiAssistant()

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    model: false,
    voice: false,
    transcriber: false,
    messages: false,
    callSettings: false,
    advanced: false,
  })

  // Form state
  const [formData, setFormData] = useState<any>({})
  const [newIdleMessage, setNewIdleMessage] = useState<string>('')

  React.useEffect(() => {
    if (assistant) {
      setFormData({
        name: assistant.name || '',
        firstMessage: assistant.firstMessage || '',
        firstMessageInterruptionsEnabled: assistant.firstMessageInterruptionsEnabled ?? false,
        firstMessageMode: assistant.firstMessageMode || 'assistant-speaks-first',
        maxDurationSeconds: assistant.maxDurationSeconds || 600,
        backgroundSound: assistant.backgroundSound || 'office',
        voicemailMessage: assistant.voicemailMessage || '',
        endCallMessage: assistant.endCallMessage || '',
        // Model
        modelProvider: assistant.model?.provider || 'openai',
        modelName: assistant.model?.model || 'gpt-3.5-turbo',
        temperature: assistant.model?.temperature?.toString() || '1',
        // Voice
        voiceProvider: assistant.voice?.provider || 'azure',
        voiceId: assistant.voice?.voiceId || '',
        voiceSpeed: assistant.voice?.speed?.toString() || '1',
        // Idle Messages
        idleMessages: (assistant as any).idleMessages || ['Are you still there?'],
        maxIdleMessages: (assistant as any).maxIdleMessages?.toString() || '3',
        idleTimeout: (assistant as any).idleTimeout?.toString() || '7.5',
        // Call Timeout
        silenceTimeout: (assistant as any).silenceTimeout?.toString() || '30',
        // Start Speaking Plan
        waitSeconds: (assistant as any).startSpeakingPlan?.waitSeconds?.toString() || '0.8',
        smartEndpointing: (assistant as any).startSpeakingPlan?.smartEndpointing || 'vapi',
        // Stop Speaking Plan
        numberOfWords: (assistant as any).stopSpeakingPlan?.numberOfWords?.toString() || '0',
        voiceSeconds: (assistant as any).stopSpeakingPlan?.voiceSeconds?.toString() || '0.4',
        backOffSeconds: (assistant as any).stopSpeakingPlan?.backOffSeconds?.toString() || '1',
      })
    }
  }, [assistant])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!assistantId) {
      Alert.alert('Error', 'No assistant ID found')
      return
    }

    try {
      const updates: any = {}

      // Basic fields
      if (formData.name !== undefined) updates.name = formData.name
      if (formData.firstMessage !== undefined) updates.firstMessage = formData.firstMessage
      if (formData.firstMessageInterruptionsEnabled !== undefined)
        updates.firstMessageInterruptionsEnabled = formData.firstMessageInterruptionsEnabled
      if (formData.firstMessageMode !== undefined) updates.firstMessageMode = formData.firstMessageMode
      if (formData.maxDurationSeconds !== undefined)
        updates.maxDurationSeconds = parseFloat(formData.maxDurationSeconds) || 600
      if (formData.backgroundSound !== undefined) updates.backgroundSound = formData.backgroundSound
      if (formData.voicemailMessage !== undefined) updates.voicemailMessage = formData.voicemailMessage
      if (formData.endCallMessage !== undefined) updates.endCallMessage = formData.endCallMessage

      // Model - Only update temperature (provider and model are locked)
      if (formData.temperature !== undefined) {
        updates.model = {
          ...(assistant?.model || {}),
          // Preserve locked fields from existing assistant
          provider: assistant?.model?.provider,
          model: assistant?.model?.model,
          // Only update temperature
          temperature: formData.temperature ? parseFloat(formData.temperature) : assistant?.model?.temperature,
        }
      }

      // Voice - Only update speed (provider and voiceId are locked)
      if (formData.voiceSpeed !== undefined) {
        updates.voice = {
          ...(assistant?.voice || {}),
          // Preserve locked fields from existing assistant
          provider: assistant?.voice?.provider,
          voiceId: assistant?.voice?.voiceId,
          // Only update speed
          speed: formData.voiceSpeed ? parseFloat(formData.voiceSpeed) : assistant?.voice?.speed,
        }
      }

      // Idle Messages
      if (formData.idleMessages !== undefined) {
        updates.idleMessages = formData.idleMessages
      }
      if (formData.maxIdleMessages !== undefined) {
        updates.maxIdleMessages = parseInt(formData.maxIdleMessages) || 3
      }
      if (formData.idleTimeout !== undefined) {
        updates.idleTimeout = parseFloat(formData.idleTimeout) || 7.5
      }

      // Call Timeout
      if (formData.silenceTimeout !== undefined) {
        updates.silenceTimeout = parseInt(formData.silenceTimeout) || 30
      }

      // Start Speaking Plan
      if (formData.waitSeconds !== undefined || formData.smartEndpointing !== undefined) {
        updates.startSpeakingPlan = {
          ...(assistant?.startSpeakingPlan || {}),
          waitSeconds: formData.waitSeconds ? parseFloat(formData.waitSeconds) : 0.8,
          smartEndpointing: formData.smartEndpointing || 'vapi',
        }
      }

      // Stop Speaking Plan
      if (formData.numberOfWords !== undefined || formData.voiceSeconds !== undefined || formData.backOffSeconds !== undefined) {
        updates.stopSpeakingPlan = {
          ...(assistant?.stopSpeakingPlan || {}),
          numberOfWords: formData.numberOfWords ? parseInt(formData.numberOfWords) : 0,
          voiceSeconds: formData.voiceSeconds ? parseFloat(formData.voiceSeconds) : 0.4,
          backOffSeconds: formData.backOffSeconds ? parseInt(formData.backOffSeconds) : 1,
        }
      }

      await updateMutation.mutateAsync({
        assistantId,
        updates,
      })

      Alert.alert('Success', 'Assistant updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update assistant')
    }
  }

  if (isLoadingAssistant) {
    return <LoadingSpinner />
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Update Assistant</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No assistant ID found</Text>
          </View>
        </LinearGradient>
      </View>
    )
  }

  if (assistantError) {
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Update Assistant</Text>
            <View style={styles.placeholder} />
          </View>
          <ErrorMessage error={assistantError} onRetry={() => {}} />
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Update Assistant</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={styles.saveButton}
          >
            {updateMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Settings */}
          <ExpandableSection
            title="Basic Settings"
            expanded={expandedSections.basic}
            onToggle={() => toggleSection('basic')}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name || ''}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Assistant name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.helpText}>Required for assistant transfers (max 40 characters)</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>First Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.firstMessage || ''}
                onChangeText={(value) => updateField('firstMessage', value)}
                placeholder="Hello! How can I help you today?"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helpText}>First message the assistant will say (or URL to audio file)</Text>
            </View>

            <View style={styles.field}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Allow First Message Interruptions</Text>
                <Switch
                  value={formData.firstMessageInterruptionsEnabled ?? false}
                  onValueChange={(value) => updateField('firstMessageInterruptionsEnabled', value)}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <Text style={styles.helpText}>Allow user to interrupt the first message</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>First Message Mode</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'assistant-speaks-first', label: 'Assistant Speaks First' },
                  { value: 'assistant-waits-for-user', label: 'Assistant Waits for User' },
                  {
                    value: 'assistant-speaks-first-with-model-generated-message',
                    label: 'Assistant Speaks First (Model Generated)',
                  },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioOption,
                      formData.firstMessageMode === option.value && styles.radioOptionSelected,
                    ]}
                    onPress={() => updateField('firstMessageMode', option.value)}
                  >
                    <Text
                      style={[
                        styles.radioOptionText,
                        formData.firstMessageMode === option.value && styles.radioOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ExpandableSection>

          {/* Model Configuration */}
          <ExpandableSection
            title="Model Configuration"
            expanded={expandedSections.model}
            onToggle={() => toggleSection('model')}
          >
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Provider</Text>
                <MaterialCommunityIcons name="lock" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.lockedLabel}>Locked</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.modelProvider || ''}
                editable={false}
                placeholder="openai"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.helpText}>This field is currently locked and cannot be modified.</Text>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Model</Text>
                <MaterialCommunityIcons name="lock" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.lockedLabel}>Locked</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.modelName || ''}
                editable={false}
                placeholder="gpt-3.5-turbo"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.helpText}>This field is currently locked and cannot be modified.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Temperature (0-2)</Text>
              <TextInput
                style={styles.input}
                value={formData.temperature?.toString() || ''}
                onChangeText={(value) => updateField('temperature', value)}
                placeholder="1"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helpText}>Controls randomness (0 = deterministic, 2 = creative)</Text>
            </View>
          </ExpandableSection>

          {/* Voice Configuration */}
          <ExpandableSection
            title="Voice Configuration"
            expanded={expandedSections.voice}
            onToggle={() => toggleSection('voice')}
          >
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Voice Provider</Text>
                <MaterialCommunityIcons name="lock" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.lockedLabel}>Locked</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.voiceProvider || ''}
                editable={false}
                placeholder="azure"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.helpText}>This field is currently locked and cannot be modified.</Text>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Voice ID</Text>
                <MaterialCommunityIcons name="lock" size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.lockedLabel}>Locked</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.voiceId || ''}
                editable={false}
                placeholder="andrew"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.helpText}>This field is currently locked and cannot be modified.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Speed (0.5-2.0)</Text>
              <TextInput
                style={styles.input}
                value={formData.voiceSpeed?.toString() || ''}
                onChangeText={(value) => updateField('voiceSpeed', value)}
                placeholder="1"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helpText}>Speech rate multiplier</Text>
            </View>
          </ExpandableSection>

          {/* Call Settings */}
          <ExpandableSection
            title="Call Settings"
            expanded={expandedSections.callSettings}
            onToggle={() => toggleSection('callSettings')}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Max Duration (seconds)</Text>
              <TextInput
                style={styles.input}
                value={formData.maxDurationSeconds?.toString() || ''}
                onChangeText={(value) => updateField('maxDurationSeconds', value)}
                placeholder="600"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="number-pad"
              />
              <Text style={styles.helpText}>Maximum call duration (10-43200 seconds, default: 600)</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Background Sound</Text>
              <View style={styles.radioGroup}>
                {['off', 'office', 'coffee-shop', 'outdoor'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.radioOption,
                      formData.backgroundSound === option && styles.radioOptionSelected,
                    ]}
                    onPress={() => updateField('backgroundSound', option)}
                  >
                    <Text
                      style={[
                        styles.radioOptionText,
                        formData.backgroundSound === option && styles.radioOptionTextSelected,
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.helpText}>Background audio during calls</Text>
            </View>
          </ExpandableSection>

          {/* Message Settings */}
          <ExpandableSection
            title="Message Settings"
            expanded={expandedSections.messages}
            onToggle={() => toggleSection('messages')}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Voicemail Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.voicemailMessage || ''}
                onChangeText={(value) => updateField('voicemailMessage', value)}
                placeholder="Leave a message after the beep..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helpText}>Message when call goes to voicemail (max 1000 chars)</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>End Call Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.endCallMessage || ''}
                onChangeText={(value) => updateField('endCallMessage', value)}
                placeholder="Thank you for calling. Goodbye!"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helpText}>Message before ending call (max 1000 chars)</Text>
            </View>
          </ExpandableSection>

          {/* Advanced Settings */}
          <ExpandableSection
            title="Advanced Settings"
            expanded={expandedSections.advanced}
            onToggle={() => toggleSection('advanced')}
          >
            {/* Idle Messages */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Idle Messages</Text>
              <Text style={styles.helpText}>Messages that the assistant will speak when the user hasn't responded.</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>Idle Messages</Text>
                <View style={styles.chipContainer}>
                  {Array.isArray(formData.idleMessages) && formData.idleMessages.map((msg: string, index: number) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{msg}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          const newMessages = [...formData.idleMessages]
                          newMessages.splice(index, 1)
                          updateField('idleMessages', newMessages)
                        }}
                        style={styles.chipRemove}
                      >
                        <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.addChipContainer}>
                    <TextInput
                      style={styles.addChipInput}
                      value={newIdleMessage}
                      onChangeText={setNewIdleMessage}
                      placeholder="Add message..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      onSubmitEditing={() => {
                        if (newIdleMessage.trim()) {
                          const newMessages = [...(formData.idleMessages || []), newIdleMessage.trim()]
                          updateField('idleMessages', newMessages)
                          setNewIdleMessage('')
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.addChipButton}
                      onPress={() => {
                        if (newIdleMessage.trim()) {
                          const newMessages = [...(formData.idleMessages || []), newIdleMessage.trim()]
                          updateField('idleMessages', newMessages)
                          setNewIdleMessage('')
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="format-list-bulleted" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Max Idle Messages</Text>
                </View>
                <Text style={styles.helpText}>Maximum number of times idle messages can be spoken during the call.</Text>
                <Slider
                  value={parseFloat(formData.maxIdleMessages || '3')}
                  onValueChange={(val) => updateField('maxIdleMessages', Math.round(val).toString())}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="timer-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Idle Timeout</Text>
                </View>
                <Text style={styles.helpText}>Timeout in seconds before an idle message is spoken.</Text>
                <Slider
                  value={parseFloat(formData.idleTimeout || '7.5')}
                  onValueChange={(val) => updateField('idleTimeout', val.toString())}
                  minimumValue={5}
                  maximumValue={60}
                  step={0.5}
                  unit="sec"
                />
              </View>
            </View>

            {/* Call Timeout Settings */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Call Timeout Settings</Text>
              <Text style={styles.helpText}>Configure when the assistant should end a call based on silence or duration.</Text>
              
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="phone-off" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Silence Timeout</Text>
                </View>
                <Text style={styles.helpText}>How long to wait before a call is automatically ended due to inactivity.</Text>
                <Slider
                  value={parseFloat(formData.silenceTimeout || '30')}
                  onValueChange={(val) => updateField('silenceTimeout', Math.round(val).toString())}
                  minimumValue={10}
                  maximumValue={3600}
                  step={1}
                  unit="sec"
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Maximum Duration</Text>
                </View>
                <Text style={styles.helpText}>The maximum number of seconds a call will last.</Text>
                <Slider
                  value={parseFloat(formData.maxDurationSeconds?.toString() || '600')}
                  onValueChange={(val) => updateField('maxDurationSeconds', Math.round(val).toString())}
                  minimumValue={10}
                  maximumValue={43200}
                  step={1}
                  unit="sec"
                />
              </View>
            </View>

            {/* Start Speaking Plan */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Start Speaking Plan</Text>
              <Text style={styles.helpText}>This is the plan for when the assistant should start talking.</Text>
              
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="timer-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Wait seconds</Text>
                </View>
                <Text style={styles.helpText}>This is how long assistant waits before speaking.</Text>
                <Slider
                  value={parseFloat(formData.waitSeconds || '0.8')}
                  onValueChange={(val) => updateField('waitSeconds', val.toString())}
                  minimumValue={0}
                  maximumValue={5}
                  step={0.1}
                  unit="sec"
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="brain" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Smart Endpointing</Text>
                </View>
                <Text style={styles.helpText}>Enable for more accurate speech endpoint detection. LiveKit is only available in English.</Text>
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={styles.select}
                    onPress={() => {
                      Alert.alert(
                        'Smart Endpointing',
                        'Select endpointing provider',
                        [
                          { text: 'Vapi', onPress: () => updateField('smartEndpointing', 'vapi') },
                          { text: 'LiveKit', onPress: () => updateField('smartEndpointing', 'livekit') },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      )
                    }}
                  >
                    <Text style={styles.selectText}>
                      {formData.smartEndpointing === 'livekit' ? 'LiveKit' : 'Vapi'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Stop Speaking Plan */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Stop Speaking Plan</Text>
              <Text style={styles.helpText}>This is the plan for when the assistant should stop talking.</Text>
              
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="pound" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Number of words</Text>
                </View>
                <Text style={styles.helpText}>This is the number of words that the customer has to say before the assistant will stop talking.</Text>
                <Slider
                  value={parseFloat(formData.numberOfWords || '0')}
                  onValueChange={(val) => updateField('numberOfWords', Math.round(val).toString())}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="timer-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Voice seconds</Text>
                </View>
                <Text style={styles.helpText}>This is the seconds customer has to speak before the assistant stops talking.</Text>
                <Slider
                  value={parseFloat(formData.voiceSeconds || '0.4')}
                  onValueChange={(val) => updateField('voiceSeconds', val.toString())}
                  minimumValue={0}
                  maximumValue={0.5}
                  step={0.1}
                  unit="sec"
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="refresh" size={20} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.label}>Back off seconds</Text>
                </View>
                <Text style={styles.helpText}>This is the seconds to wait before the assistant will start talking again after being interrupted.</Text>
                <Slider
                  value={parseFloat(formData.backOffSeconds || '1')}
                  onValueChange={(val) => updateField('backOffSeconds', Math.round(val).toString())}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  unit="sec"
                />
              </View>
            </View>
          </ExpandableSection>

          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[styles.saveButtonLarge, updateMutation.isPending && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <LoadingSpinner />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonLargeText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  field: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  lockedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    opacity: 0.7,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  radioOptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  radioOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButtonContainer: {
    padding: 16,
    paddingTop: 8,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonLargeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Chip styles
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D4AA',
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
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Select styles
  selectContainer: {
    marginTop: 8,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 14,
  },
  selectText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Subsection styles (for nested content within Advanced Settings)
  subsection: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
})

