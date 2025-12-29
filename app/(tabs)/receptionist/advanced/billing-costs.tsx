/**
 * Billing & Cost Controls screen
 * Configure spend limits, budgets, alerts, and cost controls
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

export default function BillingCostControlsScreen() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const assistantId = useUserAssistantId()

  const { data: assistant, isLoading: isLoadingAssistant, error: assistantError } = useVapiAssistant(assistantId)
  const updateMutation = useUpdateVapiAssistant()

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    spendLimits: true,
    alerts: false,
    assistantCaps: false,
    numberCaps: false,
    budgets: false,
    modelPricing: false,
    toolAttribution: false,
    webhooks: false,
  })

  // Form state
  const [formData, setFormData] = useState({
    // Hard spend limits
    hardSpendLimitEnabled: false,
    hardSpendLimit: '',
    // Soft alerts
    softAlertEnabled: false,
    softAlertThreshold: '',
    softAlertEmail: '',
    // Cost per assistant caps
    assistantCapEnabled: false,
    assistantCapAmount: '',
    // Cost per number caps
    numberCapEnabled: false,
    numberCapAmount: '',
    // Daily / monthly budgets
    dailyBudgetEnabled: false,
    dailyBudget: '',
    monthlyBudgetEnabled: false,
    monthlyBudget: '',
    // Model-specific pricing (example fields)
    modelPricingEnabled: false,
    // Tool cost attribution
    toolAttributionEnabled: false,
    // Usage alerts via webhook
    webhookAlertEnabled: false,
    webhookUrl: '',
  })

  useEffect(() => {
    if (assistant?.metadata) {
      const metadata = assistant.metadata as any
      setFormData({
        hardSpendLimitEnabled: metadata.hardSpendLimitEnabled || false,
        hardSpendLimit: metadata.hardSpendLimit?.toString() || '',
        softAlertEnabled: metadata.softAlertEnabled || false,
        softAlertThreshold: metadata.softAlertThreshold?.toString() || '',
        softAlertEmail: metadata.softAlertEmail || '',
        assistantCapEnabled: metadata.assistantCapEnabled || false,
        assistantCapAmount: metadata.assistantCapAmount?.toString() || '',
        numberCapEnabled: metadata.numberCapEnabled || false,
        numberCapAmount: metadata.numberCapAmount?.toString() || '',
        dailyBudgetEnabled: metadata.dailyBudgetEnabled || false,
        dailyBudget: metadata.dailyBudget?.toString() || '',
        monthlyBudgetEnabled: metadata.monthlyBudgetEnabled || false,
        monthlyBudget: metadata.monthlyBudget?.toString() || '',
        modelPricingEnabled: metadata.modelPricingEnabled || false,
        toolAttributionEnabled: metadata.toolAttributionEnabled || false,
        webhookAlertEnabled: metadata.webhookAlertEnabled || false,
        webhookUrl: metadata.webhookUrl || '',
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
        hardSpendLimitEnabled: formData.hardSpendLimitEnabled,
        hardSpendLimit: formData.hardSpendLimit ? parseFloat(formData.hardSpendLimit) : undefined,
        softAlertEnabled: formData.softAlertEnabled,
        softAlertThreshold: formData.softAlertThreshold ? parseFloat(formData.softAlertThreshold) : undefined,
        softAlertEmail: formData.softAlertEmail || undefined,
        assistantCapEnabled: formData.assistantCapEnabled,
        assistantCapAmount: formData.assistantCapAmount ? parseFloat(formData.assistantCapAmount) : undefined,
        numberCapEnabled: formData.numberCapEnabled,
        numberCapAmount: formData.numberCapAmount ? parseFloat(formData.numberCapAmount) : undefined,
        dailyBudgetEnabled: formData.dailyBudgetEnabled,
        dailyBudget: formData.dailyBudget ? parseFloat(formData.dailyBudget) : undefined,
        monthlyBudgetEnabled: formData.monthlyBudgetEnabled,
        monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : undefined,
        modelPricingEnabled: formData.modelPricingEnabled,
        toolAttributionEnabled: formData.toolAttributionEnabled,
        webhookAlertEnabled: formData.webhookAlertEnabled,
        webhookUrl: formData.webhookUrl || undefined,
      }

      await updateMutation.mutateAsync({
        assistantId,
        updates: {
          metadata,
        },
      })

      Alert.alert('Success', 'Billing & cost controls updated successfully!')
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update billing & cost controls'
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
          <Text style={styles.title}>Billing & Cost Controls</Text>
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
              These settings require a Private API key. Configure spend limits, budgets, and alerts to control costs.
            </Text>
          </View>

          {/* Hard Spend Limits */}
          <ExpandableSection
            title="Hard Spend Limits"
            expanded={expandedSections.spendLimits}
            onToggle={() => toggleSection('spendLimits')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Hard Spend Limit</Text>
                <Text style={styles.settingDescription}>
                  Stop all usage when the limit is reached
                </Text>
              </View>
              <Switch
                value={formData.hardSpendLimitEnabled}
                onValueChange={(value) => updateField('hardSpendLimitEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.hardSpendLimitEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.hardSpendLimitEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Spend Limit ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.hardSpendLimit}
                  onChangeText={(text) => updateField('hardSpendLimit', text)}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </ExpandableSection>

          {/* Soft Alerts */}
          <ExpandableSection
            title="Soft Alerts"
            expanded={expandedSections.alerts}
            onToggle={() => toggleSection('alerts')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Soft Alerts</Text>
                <Text style={styles.settingDescription}>
                  Get notified when approaching your limit
                </Text>
              </View>
              <Switch
                value={formData.softAlertEnabled}
                onValueChange={(value) => updateField('softAlertEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.softAlertEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.softAlertEnabled && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Alert Threshold ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.softAlertThreshold}
                    onChangeText={(text) => updateField('softAlertThreshold', text)}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Alert Email</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.softAlertEmail}
                    onChangeText={(text) => updateField('softAlertEmail', text)}
                    placeholder="alerts@example.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}
          </ExpandableSection>

          {/* Cost per Assistant Caps */}
          <ExpandableSection
            title="Cost per Assistant Caps"
            expanded={expandedSections.assistantCaps}
            onToggle={() => toggleSection('assistantCaps')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Assistant Cost Cap</Text>
                <Text style={styles.settingDescription}>
                  Set maximum spending per assistant
                </Text>
              </View>
              <Switch
                value={formData.assistantCapEnabled}
                onValueChange={(value) => updateField('assistantCapEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.assistantCapEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.assistantCapEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum Cost per Assistant ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.assistantCapAmount}
                  onChangeText={(text) => updateField('assistantCapAmount', text)}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </ExpandableSection>

          {/* Cost per Number Caps */}
          <ExpandableSection
            title="Cost per Number Caps"
            expanded={expandedSections.numberCaps}
            onToggle={() => toggleSection('numberCaps')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Number Cost Cap</Text>
                <Text style={styles.settingDescription}>
                  Set maximum spending per phone number
                </Text>
              </View>
              <Switch
                value={formData.numberCapEnabled}
                onValueChange={(value) => updateField('numberCapEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.numberCapEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.numberCapEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum Cost per Number ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.numberCapAmount}
                  onChangeText={(text) => updateField('numberCapAmount', text)}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </ExpandableSection>

          {/* Daily / Monthly Budgets */}
          <ExpandableSection
            title="Daily / Monthly Budgets"
            expanded={expandedSections.budgets}
            onToggle={() => toggleSection('budgets')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Daily Budget</Text>
                <Text style={styles.settingDescription}>
                  Set a maximum daily spending limit
                </Text>
              </View>
              <Switch
                value={formData.dailyBudgetEnabled}
                onValueChange={(value) => updateField('dailyBudgetEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.dailyBudgetEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.dailyBudgetEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Budget ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dailyBudget}
                  onChangeText={(text) => updateField('dailyBudget', text)}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            <View style={[styles.settingRow, { marginTop: 20 }]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Monthly Budget</Text>
                <Text style={styles.settingDescription}>
                  Set a maximum monthly spending limit
                </Text>
              </View>
              <Switch
                value={formData.monthlyBudgetEnabled}
                onValueChange={(value) => updateField('monthlyBudgetEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.monthlyBudgetEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.monthlyBudgetEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Monthly Budget ($)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.monthlyBudget}
                  onChangeText={(text) => updateField('monthlyBudget', text)}
                  placeholder="0.00"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          </ExpandableSection>

          {/* Model-specific Pricing */}
          <ExpandableSection
            title="Model-specific Pricing"
            expanded={expandedSections.modelPricing}
            onToggle={() => toggleSection('modelPricing')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Model Pricing</Text>
                <Text style={styles.settingDescription}>
                  Configure custom pricing per model
                </Text>
              </View>
              <Switch
                value={formData.modelPricingEnabled}
                onValueChange={(value) => updateField('modelPricingEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.modelPricingEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.modelPricingEnabled && (
              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="information-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.infoText}>
                  Model-specific pricing is configured at the organization level in the dashboard.
                </Text>
              </View>
            )}
          </ExpandableSection>

          {/* Tool Cost Attribution */}
          <ExpandableSection
            title="Tool Cost Attribution"
            expanded={expandedSections.toolAttribution}
            onToggle={() => toggleSection('toolAttribution')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Tool Attribution</Text>
                <Text style={styles.settingDescription}>
                  Track costs per tool usage
                </Text>
              </View>
              <Switch
                value={formData.toolAttributionEnabled}
                onValueChange={(value) => updateField('toolAttributionEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.toolAttributionEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
          </ExpandableSection>

          {/* Usage Alerts via Webhook */}
          <ExpandableSection
            title="Usage Alerts via Webhook"
            expanded={expandedSections.webhooks}
            onToggle={() => toggleSection('webhooks')}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Enable Webhook Alerts</Text>
                <Text style={styles.settingDescription}>
                  Receive usage alerts via webhook
                </Text>
              </View>
              <Switch
                value={formData.webhookAlertEnabled}
                onValueChange={(value) => updateField('webhookAlertEnabled', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                thumbColor={formData.webhookAlertEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
            {formData.webhookAlertEnabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Webhook URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.webhookUrl}
                  onChangeText={(text) => updateField('webhookUrl', text)}
                  placeholder="https://example.com/webhook"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
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
                <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
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
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
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

