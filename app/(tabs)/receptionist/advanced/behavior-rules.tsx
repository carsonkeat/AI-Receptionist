/**
 * Behavior Rules screen
 * Configure allowed/blocked intents, escalation keywords, compliance, and behavior rules
 */

import React, { useState, useEffect } from 'react'
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
import { LoadingSpinner, ErrorMessage, ExpandableSection } from '@/components/common'

export default function BehaviorRulesScreen() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const assistantId = useUserAssistantId()

  const { data: assistant, isLoading: isLoadingAssistant, error: assistantError } = useVapiAssistant(assistantId)
  const updateMutation = useUpdateVapiAssistant()

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    intents: true,
    escalation: false,
    compliance: false,
    tone: false,
    fallback: false,
    callRules: false,
    system: false,
  })

  // Form state
  const [formData, setFormData] = useState({
    // Allowed/Blocked Intents
    allowedIntents: [] as string[],
    blockedIntents: [] as string[],
    newAllowedIntent: '',
    newBlockedIntent: '',
    // Escalation
    escalationKeywords: [] as string[],
    newEscalationKeyword: '',
    // Compliance
    profanityTolerance: 'low', // low, medium, high
    complianceGuardrails: '',
    // Tone
    tonePreset: 'professional', // professional, friendly, formal, casual
    // Fallback
    scriptedFallbackResponses: [] as Array<{ trigger: string; response: string }>,
    newFallbackTrigger: '',
    newFallbackResponse: '',
    // Call Rules
    callEndingRules: [] as string[],
    newCallEndingRule: '',
    maxCallDuration: '600',
    // System
    retryLogicEnabled: false,
    maxRetries: '3',
    retryDelay: '1000',
  })

  useEffect(() => {
    if (assistant?.metadata) {
      const metadata = assistant.metadata as any
      setFormData({
        allowedIntents: metadata.allowedIntents || [],
        blockedIntents: metadata.blockedIntents || [],
        newAllowedIntent: '',
        newBlockedIntent: '',
        escalationKeywords: metadata.escalationKeywords || [],
        newEscalationKeyword: '',
        profanityTolerance: metadata.profanityTolerance || 'low',
        complianceGuardrails: metadata.complianceGuardrails || '',
        tonePreset: metadata.tonePreset || 'professional',
        scriptedFallbackResponses: metadata.scriptedFallbackResponses || [],
        newFallbackTrigger: '',
        newFallbackResponse: '',
        callEndingRules: metadata.callEndingRules || [],
        newCallEndingRule: '',
        maxCallDuration: metadata.maxCallDuration?.toString() || '600',
        retryLogicEnabled: metadata.retryLogicEnabled || false,
        maxRetries: metadata.maxRetries?.toString() || '3',
        retryDelay: metadata.retryDelay?.toString() || '1000',
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
    setFormData((prev) => ({
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
      const metadata = {
        ...(assistant?.metadata || {}),
        allowedIntents: formData.allowedIntents,
        blockedIntents: formData.blockedIntents,
        escalationKeywords: formData.escalationKeywords,
        profanityTolerance: formData.profanityTolerance,
        complianceGuardrails: formData.complianceGuardrails || undefined,
        tonePreset: formData.tonePreset,
        scriptedFallbackResponses: formData.scriptedFallbackResponses,
        callEndingRules: formData.callEndingRules,
        maxCallDuration: formData.maxCallDuration ? parseInt(formData.maxCallDuration) : undefined,
        retryLogicEnabled: formData.retryLogicEnabled,
        maxRetries: formData.maxRetries ? parseInt(formData.maxRetries) : undefined,
        retryDelay: formData.retryDelay ? parseInt(formData.retryDelay) : undefined,
      }

      await updateMutation.mutateAsync({
        assistantId,
        updates: {
          metadata,
        },
      })

      Alert.alert('Success', 'Behavior rules updated successfully!')
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update behavior rules'
      )
    }
  }

  if (isLoadingAssistant) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#7A9CC6', '#8BA5C4', '#9A94B8', '#8B8BA3', '#A09CB2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <LoadingSpinner />
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
          <ErrorMessage error={assistantError} />
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
          <Text style={styles.title}>Behavior Rules</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.infoText}>
              Configure behavior rules, intents, compliance, and call handling. These settings require a Private API key.
            </Text>
          </View>

          {/* Allowed/Blocked Intents */}
          <ExpandableSection
            title="Allowed & Blocked Intents"
            expanded={expandedSections.intents}
            onToggle={() => toggleSection('intents')}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Allowed Intents</Text>
              <Text style={styles.helpText}>Intents that the assistant is allowed to handle (routing logic)</Text>
              <View style={styles.chipContainer}>
                {formData.allowedIntents.map((intent, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{intent}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newIntents = [...formData.allowedIntents]
                        newIntents.splice(index, 1)
                        updateField('allowedIntents', newIntents)
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
                    value={formData.newAllowedIntent}
                    onChangeText={(text) => updateField('newAllowedIntent', text)}
                    placeholder="Add intent..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    onSubmitEditing={() => {
                      if (formData.newAllowedIntent.trim()) {
                        updateField('allowedIntents', [...formData.allowedIntents, formData.newAllowedIntent.trim()])
                        updateField('newAllowedIntent', '')
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addChipButton}
                    onPress={() => {
                      if (formData.newAllowedIntent.trim()) {
                        updateField('allowedIntents', [...formData.allowedIntents, formData.newAllowedIntent.trim()])
                        updateField('newAllowedIntent', '')
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Blocked Intents</Text>
              <Text style={styles.helpText}>Intents that the assistant should block for safety</Text>
              <View style={styles.chipContainer}>
                {formData.blockedIntents.map((intent, index) => (
                  <View key={index} style={[styles.chip, styles.chipBlocked]}>
                    <Text style={styles.chipText}>{intent}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newIntents = [...formData.blockedIntents]
                        newIntents.splice(index, 1)
                        updateField('blockedIntents', newIntents)
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
                    value={formData.newBlockedIntent}
                    onChangeText={(text) => updateField('newBlockedIntent', text)}
                    placeholder="Add intent..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    onSubmitEditing={() => {
                      if (formData.newBlockedIntent.trim()) {
                        updateField('blockedIntents', [...formData.blockedIntents, formData.newBlockedIntent.trim()])
                        updateField('newBlockedIntent', '')
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addChipButton}
                    onPress={() => {
                      if (formData.newBlockedIntent.trim()) {
                        updateField('blockedIntents', [...formData.blockedIntents, formData.newBlockedIntent.trim()])
                        updateField('newBlockedIntent', '')
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ExpandableSection>

          {/* Escalation Keywords */}
          <ExpandableSection
            title="Escalation Keywords"
            expanded={expandedSections.escalation}
            onToggle={() => toggleSection('escalation')}
          >
            <Text style={styles.helpText}>Keywords that trigger call transfer to a human agent</Text>
            <View style={styles.field}>
              <View style={styles.chipContainer}>
                {formData.escalationKeywords.map((keyword, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{keyword}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newKeywords = [...formData.escalationKeywords]
                        newKeywords.splice(index, 1)
                        updateField('escalationKeywords', newKeywords)
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
                    value={formData.newEscalationKeyword}
                    onChangeText={(text) => updateField('newEscalationKeyword', text)}
                    placeholder="Add keyword..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    onSubmitEditing={() => {
                      if (formData.newEscalationKeyword.trim()) {
                        updateField('escalationKeywords', [...formData.escalationKeywords, formData.newEscalationKeyword.trim()])
                        updateField('newEscalationKeyword', '')
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addChipButton}
                    onPress={() => {
                      if (formData.newEscalationKeyword.trim()) {
                        updateField('escalationKeywords', [...formData.escalationKeywords, formData.newEscalationKeyword.trim()])
                        updateField('newEscalationKeyword', '')
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ExpandableSection>

          {/* Compliance & Profanity */}
          <ExpandableSection
            title="Compliance & Profanity"
            expanded={expandedSections.compliance}
            onToggle={() => toggleSection('compliance')}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Profanity Tolerance</Text>
              <Text style={styles.helpText}>Set tolerance level for profanity detection</Text>
              <View style={styles.radioGroup}>
                {['low', 'medium', 'high'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.radioOption,
                      formData.profanityTolerance === level && styles.radioOptionSelected,
                    ]}
                    onPress={() => updateField('profanityTolerance', level)}
                  >
                    <Text
                      style={[
                        styles.radioOptionText,
                        formData.profanityTolerance === level && styles.radioOptionTextSelected,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Compliance Guardrails</Text>
              <Text style={styles.helpText}>Legal compliance rules and guardrails (write-only)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.complianceGuardrails}
                onChangeText={(text) => updateField('complianceGuardrails', text)}
                placeholder="Enter compliance rules..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                numberOfLines={4}
              />
            </View>
          </ExpandableSection>

          {/* Tone Presets */}
          <ExpandableSection
            title="Tone Presets"
            expanded={expandedSections.tone}
            onToggle={() => toggleSection('tone')}
          >
            <Text style={styles.helpText}>Configure the tone and brand behavior of the assistant</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Tone Preset</Text>
              <View style={styles.radioGroup}>
                {['professional', 'friendly', 'formal', 'casual'].map((tone) => (
                  <TouchableOpacity
                    key={tone}
                    style={[
                      styles.radioOption,
                      formData.tonePreset === tone && styles.radioOptionSelected,
                    ]}
                    onPress={() => updateField('tonePreset', tone)}
                  >
                    <Text
                      style={[
                        styles.radioOptionText,
                        formData.tonePreset === tone && styles.radioOptionTextSelected,
                      ]}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ExpandableSection>

          {/* Scripted Fallback Responses */}
          <ExpandableSection
            title="Scripted Fallback Responses"
            expanded={expandedSections.fallback}
            onToggle={() => toggleSection('fallback')}
          >
            <Text style={styles.helpText}>Control flow: predefined responses for specific triggers (write-only)</Text>
            {formData.scriptedFallbackResponses.map((fallback, index) => (
              <View key={index} style={styles.fallbackItem}>
                <View style={styles.fallbackHeader}>
                  <Text style={styles.fallbackTrigger}>{fallback.trigger}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newFallbacks = [...formData.scriptedFallbackResponses]
                      newFallbacks.splice(index, 1)
                      updateField('scriptedFallbackResponses', newFallbacks)
                    }}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.fallbackResponse}>{fallback.response}</Text>
              </View>
            ))}
            <View style={styles.addFallbackContainer}>
              <TextInput
                style={styles.fallbackInput}
                value={formData.newFallbackTrigger || ''}
                onChangeText={(text) => updateField('newFallbackTrigger', text)}
                placeholder="Trigger phrase..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <TextInput
                style={styles.fallbackInput}
                value={formData.newFallbackResponse || ''}
                onChangeText={(text) => updateField('newFallbackResponse', text)}
                placeholder="Response text..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  if (formData.newFallbackTrigger?.trim() && formData.newFallbackResponse?.trim()) {
                    updateField('scriptedFallbackResponses', [
                      ...formData.scriptedFallbackResponses,
                      {
                        trigger: formData.newFallbackTrigger.trim(),
                        response: formData.newFallbackResponse.trim(),
                      },
                    ])
                    updateField('newFallbackTrigger', '')
                    updateField('newFallbackResponse', '')
                  }
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </ExpandableSection>

          {/* Call Rules */}
          <ExpandableSection
            title="Call Rules"
            expanded={expandedSections.callRules}
            onToggle={() => toggleSection('callRules')}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Call Ending Rules</Text>
              <Text style={styles.helpText}>Rules that determine when to end a call</Text>
              <View style={styles.chipContainer}>
                {formData.callEndingRules.map((rule, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{rule}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newRules = [...formData.callEndingRules]
                        newRules.splice(index, 1)
                        updateField('callEndingRules', newRules)
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
                    value={formData.newCallEndingRule}
                    onChangeText={(text) => updateField('newCallEndingRule', text)}
                    placeholder="Add rule..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    onSubmitEditing={() => {
                      if (formData.newCallEndingRule.trim()) {
                        updateField('callEndingRules', [...formData.callEndingRules, formData.newCallEndingRule.trim()])
                        updateField('newCallEndingRule', '')
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.addChipButton}
                    onPress={() => {
                      if (formData.newCallEndingRule.trim()) {
                        updateField('callEndingRules', [...formData.callEndingRules, formData.newCallEndingRule.trim()])
                        updateField('newCallEndingRule', '')
                      }
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Max Call Duration (seconds)</Text>
              <Text style={styles.helpText}>Maximum duration for cost control</Text>
              <TextInput
                style={styles.input}
                value={formData.maxCallDuration}
                onChangeText={(text) => updateField('maxCallDuration', text)}
                placeholder="600"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="number-pad"
              />
            </View>
          </ExpandableSection>

          {/* System Behavior */}
          <ExpandableSection
            title="System Behavior"
            expanded={expandedSections.system}
            onToggle={() => toggleSection('system')}
          >
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={styles.switchLeft}>
                  <Text style={styles.label}>Enable Retry Logic</Text>
                  <Text style={styles.helpText}>Retry failed operations automatically</Text>
                </View>
                <Switch
                  value={formData.retryLogicEnabled}
                  onValueChange={(value) => updateField('retryLogicEnabled', value)}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                  thumbColor={formData.retryLogicEnabled ? '#FFFFFF' : '#CCCCCC'}
                />
              </View>
            </View>

            {formData.retryLogicEnabled && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Max Retries</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.maxRetries}
                    onChangeText={(text) => updateField('maxRetries', text)}
                    placeholder="3"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Retry Delay (ms)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.retryDelay}
                    onChangeText={(text) => updateField('retryDelay', text)}
                    placeholder="1000"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="number-pad"
                  />
                </View>
              </>
            )}
          </ExpandableSection>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, updateMutation.isPending && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  section: {
    margin: 16,
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
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
  chipBlocked: {
    backgroundColor: '#F44336',
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
    backgroundColor: '#00D4AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  radioOption: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 100,
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  radioOptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  radioOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fallbackItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fallbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fallbackTrigger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fallbackResponse: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addFallbackContainer: {
    gap: 8,
  },
  fallbackInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLeft: {
    flex: 1,
    marginRight: 16,
  },
  saveButton: {
    margin: 16,
    marginTop: 24,
    padding: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

