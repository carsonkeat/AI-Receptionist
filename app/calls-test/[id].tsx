/**
 * Call detail screen - VAPI API version (test)
 * Shows detailed information about a VAPI call
 */

import React, { useState, useMemo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  StatusBar,
  TextInput,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useVapiCall, useVapiAssistant } from '@/hooks/useVapi'
import { LoadingSpinner, ErrorMessage } from '@/components/common'
import { formatDateTime, formatDuration } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { formatPhoneNumber } from '@/lib/utils/phone'
import { isValidUUID } from '@/lib/utils/validation'
import { extractHighlights, extractClientInfo } from '@/lib/utils/callHighlights'
import { AudioPlayer } from '@/components/call/AudioPlayer'
import type { VapiCall } from '@/lib/api/vapi'

type Tab = 'overview' | 'transcript' | 'cost' | 'analysis'

// Overview Tab Component
function OverviewTab({
  call,
  callStatus,
  duration,
  customerNumber,
  clientInfo,
  summary,
  isResolved,
  primaryIntent,
  callFlow,
  healthSignals,
  assistantName,
}: {
  call: VapiCall
  callStatus: string | null
  duration: number
  customerNumber: string
  clientInfo: { name?: string; phone?: string; email?: string; location?: string }
  summary: string | null
  isResolved: boolean
  primaryIntent: string | null
  callFlow: string[]
  healthSignals: Array<{ type: 'good' | 'warning'; icon: string; label: string }>
  assistantName: string | null
}) {
  // Debug logging
  if (__DEV__) {
    console.log('[OverviewTab] Client Info:', clientInfo)
    console.log('[OverviewTab] Summary:', summary?.substring(0, 200))
    console.log('[OverviewTab] Call customer:', call?.customer)
    console.log('[OverviewTab] Structured outputs:', call?.artifact?.structuredOutputs)
  }
  const [showCallFlow, setShowCallFlow] = useState(false)

  // Status badge configuration
  const statusConfig = {
    completed: { icon: 'check-circle', label: 'Completed', color: '#4CAF50' },
    transferred: { icon: 'swap-horizontal', label: 'Transferred', color: '#2196F3' },
    dropped: { icon: 'phone-hangup', label: 'Dropped', color: '#FF9800' },
    error: { icon: 'alert-circle', label: 'Error', color: '#F44336' },
  }
  
  const status = statusConfig[callStatus as keyof typeof statusConfig] || statusConfig.completed

  // Get transfer destination
  const transferDestination = call.artifact?.transfers?.[0] || call.destination?.number || null

  return (
    <View>
      {/* Status Badge */}
      <View style={styles.statusBadge}>
        <MaterialCommunityIcons name={status.icon as any} size={24} color={status.color} />
        <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
      </View>

      {/* Key Info Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Call Summary</Text>
        
        {/* Date & Time - Always show */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date & Time</Text>
          <Text style={styles.infoValue}>
            {call.startedAt ? formatDateTime(call.startedAt) : 'N/A'}
          </Text>
        </View>

        {/* Duration - Always show */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={styles.infoValue}>
            {duration > 0 ? formatDuration(duration) : 'N/A'}
          </Text>
        </View>

        {/* Assistant - Always show */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assistant</Text>
          <Text style={styles.infoValue}>
            {assistantName || 'N/A'}
          </Text>
        </View>

        {/* Caller Number - Always show */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Caller Number</Text>
          <Text style={styles.infoValue}>
            {(customerNumber && customerNumber !== 'Unknown') || clientInfo.phone
              ? formatPhoneNumber(clientInfo.phone || customerNumber)
              : 'N/A'}
          </Text>
        </View>

        {/* Caller Name - Always show */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Caller Name</Text>
          <Text style={styles.infoValue}>
            {clientInfo.name || 'N/A'}
          </Text>
        </View>

        {/* Caller Email - Always show */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Caller Email</Text>
          <Text style={styles.infoValue}>
            {clientInfo.email || 'N/A'}
          </Text>
        </View>

        {/* Address - Always show */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValue}>
            {clientInfo.location || 'N/A'}
          </Text>
        </View>

        {/* AI Summary - Always show section, content conditional */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>AI Summary</Text>
          <Text style={styles.summaryText}>{summary || 'N/A'}</Text>
        </View>
      </View>

      {/* Outcome Indicators */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Outcome Indicators</Text>
        <View style={styles.outcomeGrid}>
          <View style={styles.outcomeChip}>
            <Text style={styles.outcomeChipLabel}>Resolved</Text>
            <Text style={[styles.outcomeChipValue, { color: isResolved ? '#4CAF50' : '#FF9800' }]}>
              {isResolved ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.outcomeChip}>
            <Text style={styles.outcomeChipLabel}>Transferred</Text>
            <Text style={[styles.outcomeChipValue, { color: transferDestination ? '#2196F3' : 'rgba(255, 255, 255, 0.7)' }]}>
              {transferDestination ? `Yes → Sales` : 'No'}
            </Text>
          </View>

          {/* Primary Intent - Always show */}
          <View style={styles.outcomeChip}>
            <Text style={styles.outcomeChipLabel}>Primary Intent</Text>
            <Text style={styles.outcomeChipValue}>
              {primaryIntent || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Call Flow Summary - Collapsible */}
      {callFlow.length > 0 && (
        <ExpandableSection
          title="Call Flow Summary"
          expanded={showCallFlow}
          onToggle={() => setShowCallFlow(!showCallFlow)}
        >
          <View style={styles.flowContainer}>
            {callFlow.map((step, index) => (
              <View key={index} style={styles.flowStep}>
                {index < callFlow.length - 1 && <View style={styles.flowLine} />}
                <View style={styles.flowDot} />
                <Text style={styles.flowText}>{step}</Text>
              </View>
            ))}
          </View>
        </ExpandableSection>
      )}

      {/* Quick Health Signals */}
      {healthSignals.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Call Health</Text>
          <View style={styles.healthSignalsContainer}>
            {healthSignals.map((signal, index) => (
              <View key={index} style={styles.healthSignal}>
                <MaterialCommunityIcons
                  name={signal.icon as any}
                  size={20}
                  color={signal.type === 'good' ? '#4CAF50' : '#FF9800'}
                />
                <Text style={styles.healthSignalLabel}>{signal.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  )
}

function ExpandableSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
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

// Cost Tab Component
function CostTab({ call, duration }: { call: VapiCall; duration: number }) {
  // Calculate total cost
  const totalCost = useMemo(() => {
    return call?.cost || call?.costBreakdown?.total || 0
  }, [call])

  // Calculate minutes billed (typically rounded up)
  const minutesBilled = useMemo(() => {
    if (duration > 0) {
      // Round up to nearest 6 seconds (0.1 minute) for billing
      return Math.ceil(duration / 6) / 10
    }
    return 0
  }, [duration])

  // Calculate cost per minute
  const costPerMinute = useMemo(() => {
    if (minutesBilled > 0 && totalCost > 0) {
      return totalCost / minutesBilled
    }
    return 0
  }, [totalCost, minutesBilled])

  // Get cost breakdown with percentages
  const costItems = useMemo(() => {
    const breakdown = call?.costBreakdown || {}
    const items: Array<{
      label: string
      value: number
      percentage: number
    }> = []

    if (totalCost > 0) {
      // STT (Speech-to-Text)
      if (breakdown.stt !== undefined && breakdown.stt > 0) {
        items.push({
          label: 'STT (Speech-to-Text)',
          value: breakdown.stt,
          percentage: (breakdown.stt / totalCost) * 100,
        })
      }

      // LLM
      if (breakdown.llm !== undefined && breakdown.llm > 0) {
        items.push({
          label: 'LLM',
          value: breakdown.llm,
          percentage: (breakdown.llm / totalCost) * 100,
        })
      }

      // TTS (Voice)
      if (breakdown.tts !== undefined && breakdown.tts > 0) {
        items.push({
          label: 'TTS (Voice)',
          value: breakdown.tts,
          percentage: (breakdown.tts / totalCost) * 100,
        })
      }

      // Host Platform (combine vapi and transport if both exist)
      const vapiPlatformCost = (breakdown.vapi || 0) + (breakdown.transport || 0)
      if (vapiPlatformCost > 0) {
        items.push({
          label: 'Host Platform',
          value: vapiPlatformCost,
          percentage: (vapiPlatformCost / totalCost) * 100,
        })
      } else {
        // If combined doesn't exist, show separately
        if (breakdown.vapi !== undefined && breakdown.vapi > 0) {
          items.push({
            label: 'Host Platform',
            value: breakdown.vapi,
            percentage: (breakdown.vapi / totalCost) * 100,
          })
        }
        if (breakdown.transport !== undefined && breakdown.transport > 0) {
          items.push({
            label: 'Transport',
            value: breakdown.transport,
            percentage: (breakdown.transport / totalCost) * 100,
          })
        }
      }
    }

    return items
  }, [call?.costBreakdown, totalCost])

  return (
    <View>
      {/* Total Cost Section */}
      <View style={styles.card}>
        <Text style={styles.totalCostLabel}>Total Cost</Text>
        <Text style={styles.totalCostValue}>{formatCurrency(totalCost)}</Text>
        <Text style={styles.totalCostSubtext}>
          for {formatDuration(duration)} ({minutesBilled.toFixed(2)} min billed)
        </Text>
      </View>

      {/* Cost Breakdown Section */}
      {costItems.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cost Breakdown</Text>
          {costItems.map((item, index) => (
            <View key={index} style={styles.costBreakdownItem}>
              <View style={styles.costBreakdownHeader}>
                <Text style={styles.costBreakdownLabel}>{item.label}</Text>
                <View style={styles.costBreakdownValues}>
                  <Text style={styles.costBreakdownAmount}>{formatCurrency(item.value)}</Text>
                  <Text style={styles.costBreakdownPercentage}>
                    {item.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.costProgressBarContainer}>
                <View style={styles.costProgressBarBackground}>
                  <View
                    style={[
                      styles.costProgressBarFill,
                      { width: `${Math.min(100, item.percentage)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Usage Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Usage</Text>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Duration</Text>
          <Text style={styles.usageValue}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Minutes Billed</Text>
          <Text style={styles.usageValue}>{minutesBilled.toFixed(2)}</Text>
        </View>
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>Cost per Minute</Text>
          <Text style={styles.usageValue}>{formatCurrency(costPerMinute)}</Text>
        </View>
      </View>

      {costItems.length === 0 && !call?.costBreakdown && (
        <View style={styles.card}>
          <Text style={styles.emptyText}>No cost breakdown available</Text>
        </View>
      )}
    </View>
  )
}

// Analysis Tab Component (based on Advanced tab)
function AnalysisTab({ call }: { call: VapiCall }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleCopy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text)
      Alert.alert('Copied', 'Text copied to clipboard')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Get full metadata including call properties
  const fullMetadata = useMemo(() => {
    const metadata: Record<string, any> = {}
    
    // Add call-level metadata if it exists
    if (call.metadata && typeof call.metadata === 'object') {
      Object.assign(metadata, call.metadata)
    }
    
    // Add important call properties
    const callProperties: Record<string, any> = {
      id: call.id,
      orgId: call.orgId,
      type: call.type,
      status: call.status,
      createdAt: call.createdAt,
      updatedAt: call.updatedAt,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      endedReason: call.endedReason,
      endedMessage: call.endedMessage,
      assistantId: call.assistantId,
      phoneNumberId: call.phoneNumberId,
      campaignId: call.campaignId,
      customerId: call.customerId,
      squadId: call.squadId,
      workflowId: call.workflowId,
      cost: call.cost,
      phoneCallTransport: call.phoneCallTransport,
      phoneCallProvider: call.phoneCallProvider,
      phoneCallProviderId: call.phoneCallProviderId,
    }
    
    // Only include defined/non-null values
    Object.keys(callProperties).forEach(key => {
      if (callProperties[key] !== undefined && callProperties[key] !== null) {
        metadata[key] = callProperties[key]
      }
    })
    
    // Debug logging
    if (__DEV__) {
      console.log('[AnalysisTab] Full metadata:', metadata)
      console.log('[AnalysisTab] Call metadata:', call.metadata)
      console.log('[AnalysisTab] Metadata keys:', Object.keys(metadata))
    }
    
    return metadata
  }, [call])

  // Extract performance metrics
  const perfMetrics = call?.artifact?.performanceMetrics || {}
  
  // Extract assistant info - check multiple possible locations
  const assistant = call?.assistant || {}
  const assistantOverrides = call?.assistantOverrides || {}
  
  // Debug logging in development
  if (__DEV__) {
    console.log('[AnalysisTab] Assistant data:', {
      assistant: assistant,
      assistantOverrides: assistantOverrides,
      assistantId: call?.assistantId,
    })
  }
  
  // Check if assistant data is actually populated
  const hasAssistantModel = !!(assistant?.model?.model || assistant?.model?.provider || assistantOverrides?.model?.model || assistantOverrides?.model?.provider)
  const hasAssistantVoice = !!(assistant?.voice?.voiceId || assistant?.voice?.provider || assistantOverrides?.voice?.voiceId || assistantOverrides?.voice?.provider)
  const hasAssistantData = hasAssistantModel || hasAssistantVoice
  
  // If assistant data is not populated, try to fetch it
  const assistantId = call?.assistantId
  const validAssistantId = assistantId && isValidUUID(assistantId) ? assistantId : null
  const { data: assistantData } = useVapiAssistant(
    validAssistantId && !hasAssistantData ? validAssistantId : undefined
  )
  
  // Try to get model info from multiple sources, prioritizing fetched data
  const assistantModel = assistantData?.model || assistant?.model || assistantOverrides?.model || {}
  const assistantVoice = assistantData?.voice || assistant?.voice || assistantOverrides?.voice || {}
  const assistantTranscriber = assistantData?.transcriber || assistant?.transcriber || assistantOverrides?.transcriber || {}
  
  // Merge and extract final values
  const finalModel = {
    model: assistantModel?.model || (typeof assistantModel === 'string' ? assistantModel : null),
    provider: assistantModel?.provider,
  }
  const finalVoice = {
    voiceId: assistantVoice?.voiceId || (typeof assistantVoice === 'string' ? assistantVoice : null),
    provider: assistantVoice?.provider,
  }
  const finalTranscriber = {
    provider: assistantTranscriber?.provider,
    speechModel: assistantTranscriber?.speechModel || assistantTranscriber?.model,
  }
  const finalAssistantName = assistantData?.name || assistant?.name || call?.assistant?.name || call?.assistantId || 'N/A'

  // Extract tool calls from messages
  const toolCalls = useMemo(() => {
    const tools: Array<{
      name?: string
      type?: string
      status?: string
      timestamp?: string
    }> = []
    
    const messages = call?.artifact?.messages || call?.messages || []
    messages.forEach((msg: any) => {
      if (msg.metadata?.toolCalls || msg.metadata?.tool_call) {
        tools.push({
          name: msg.metadata.toolCalls?.name || msg.metadata.tool_call?.name || 'Unknown Tool',
          type: msg.metadata.toolCalls?.type || msg.metadata.tool_call?.type,
          status: msg.metadata.toolCalls?.status || msg.metadata.tool_call?.status,
          timestamp: msg.time || msg.timestamp,
        })
      }
    })
    return tools
  }, [call])

  // Extract latency breakdown from performance metrics
  const latencyBreakdown = useMemo(() => {
    const turns = perfMetrics.turnLatencies || []
    const breakdown: Array<{
      turn: number
      role: string
      timestamp: string
      time_relative: number
      model_latency?: number
      voice_latency?: number
      transcriber_latency?: number
      turn_latency?: number
    }> = []

    turns.forEach((turn: any, index: number) => {
      breakdown.push({
        turn: index + 1,
        role: 'assistant',
        timestamp: call?.startedAt || new Date().toISOString(),
        time_relative: (index + 1) * 2, // Approximate
        model_latency: turn.modelLatency,
        voice_latency: turn.voiceLatency,
        transcriber_latency: turn.transcriberLatency,
        turn_latency: turn.turnLatency,
      })
    })

    return breakdown
  }, [perfMetrics, call])

  return (
    <View>
      {/* Latency Summary */}
      <ExpandableSection
        title="Latency Summary"
        expanded={expandedSections.has('latency')}
        onToggle={() => toggleSection('latency')}
      >
        <View style={styles.latencySummary}>
          <View style={styles.latencySummaryRow}>
            <Text style={styles.latencySummaryLabel}>Avg Turn Latency</Text>
            <Text style={styles.latencySummaryValue}>
              {perfMetrics.turnLatencyAverage ? `${perfMetrics.turnLatencyAverage.toFixed(0)}ms` : 'N/A'}
            </Text>
          </View>
        </View>
        
        {/* Latency Breakdown */}
        <View style={styles.latencyBreakdown}>
          <Text style={styles.latencyBreakdownTitle}>Latency Breakdown</Text>
          <LatencyMetric
            label="Transcriber"
            value={perfMetrics.transcriberLatencyAverage}
            color="#FF9800"
          />
          <LatencyMetric
            label="LLM"
            value={perfMetrics.modelLatencyAverage}
            color="#FFC107"
          />
          <LatencyMetric
            label="Voice"
            value={perfMetrics.voiceLatencyAverage}
            color="#2196F3"
          />
          <LatencyMetric
            label="Turn"
            value={perfMetrics.turnLatencyAverage}
            color="#2196F3"
          />
          <LatencyMetric
            label="Endpointing"
            value={perfMetrics.endpointingLatencyAverage}
            color="#4CAF50"
          />
          <LatencyMetric
            label="From Transport"
            value={perfMetrics.fromTransportLatencyAverage}
            color="#9C27B0"
          />
          <LatencyMetric
            label="To Transport"
            value={perfMetrics.toTransportLatencyAverage}
            color="#FF5722"
          />
        </View>
        
        {/* Detailed Latency Breakdown with Timestamps */}
        {latencyBreakdown && latencyBreakdown.length > 0 ? (
          <View style={styles.latencyBreakdown}>
            <Text style={styles.latencyBreakdownTitle}>Detailed Latency by Turn</Text>
            {latencyBreakdown.map((turn, index) => (
              <View key={index} style={styles.latencyTurnItem}>
                <View style={styles.latencyTurnHeader}>
                  <Text style={styles.latencyTurnLabel}>
                    Turn {turn.turn} - {turn.role === 'user' ? 'User' : turn.role === 'assistant' ? 'Assistant' : turn.role}
                  </Text>
                  <Text style={styles.latencyTurnTime}>
                    +{typeof turn.time_relative === 'number' ? turn.time_relative.toFixed(1) : '0.0'}s
                  </Text>
                </View>
                <Text style={styles.latencyTurnTimestamp}>
                  {(() => {
                    try {
                      const date = new Date(turn.timestamp)
                      return isNaN(date.getTime()) ? turn.timestamp : date.toLocaleTimeString()
                    } catch {
                      return turn.timestamp || 'N/A'
                    }
                  })()}
                </Text>
                {(turn.model_latency || turn.voice_latency || turn.transcriber_latency || turn.turn_latency) && (
                  <View style={styles.latencyTurnDetails}>
                    {turn.transcriber_latency && (
                      <Text style={styles.latencyTurnDetail}>
                        STT: {typeof turn.transcriber_latency === 'number' ? turn.transcriber_latency.toFixed(0) : turn.transcriber_latency}ms
                      </Text>
                    )}
                    {turn.model_latency && (
                      <Text style={styles.latencyTurnDetail}>
                        LLM: {typeof turn.model_latency === 'number' ? turn.model_latency.toFixed(0) : turn.model_latency}ms
                      </Text>
                    )}
                    {turn.voice_latency && (
                      <Text style={styles.latencyTurnDetail}>
                        Voice: {typeof turn.voice_latency === 'number' ? turn.voice_latency.toFixed(0) : turn.voice_latency}ms
                      </Text>
                    )}
                    {turn.turn_latency && (
                      <Text style={styles.latencyTurnDetail}>
                        Turn: {typeof turn.turn_latency === 'number' ? turn.turn_latency.toFixed(0) : turn.turn_latency}ms
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.latencyBreakdown}>
            <Text style={styles.latencyBreakdownTitle}>Detailed Latency by Turn</Text>
            <Text style={styles.emptyText}>No detailed latency data available</Text>
          </View>
        )}
      </ExpandableSection>

      {/* AI & Models */}
      <ExpandableSection
        title="AI & Models Used"
        expanded={expandedSections.has('ai')}
        onToggle={() => toggleSection('ai')}
      >
        <AnalysisInfoRow 
          label="Model" 
          value={finalModel.model || 'N/A'} 
        />
        <AnalysisInfoRow 
          label="Model Provider" 
          value={finalModel.provider || 'N/A'} 
        />
        <AnalysisInfoRow 
          label="Voice Provider" 
          value={finalVoice.provider || 'N/A'} 
        />
        <AnalysisInfoRow 
          label="Voice Name" 
          value={finalVoice.voiceId || 'N/A'} 
        />
        <AnalysisInfoRow 
          label="Speech-to-Text Provider" 
          value={finalTranscriber.provider || 'N/A'} 
        />
        <AnalysisInfoRow 
          label="STT Model" 
          value={finalTranscriber.speechModel || 'N/A'} 
        />
        <AnalysisInfoRow 
          label="Assistant Name" 
          value={finalAssistantName} 
        />
      </ExpandableSection>

      {/* Tool Calls */}
      {toolCalls.length > 0 && (
        <ExpandableSection
          title={`Tool Calls (${toolCalls.length})`}
          expanded={expandedSections.has('tools')}
          onToggle={() => toggleSection('tools')}
        >
          {toolCalls.map((tool, index) => (
            <View key={index} style={styles.toolCallItem}>
              <View style={styles.toolCallHeader}>
                <Text style={styles.toolCallName}>{tool.name || 'Unknown Tool'}</Text>
                {tool.status && (
                  <View
                    style={[
                      styles.statusBadgeSmall,
                      { backgroundColor: tool.status === 'Success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeTextSmall,
                        { color: tool.status === 'Success' ? '#4CAF50' : '#F44336' },
                      ]}
                    >
                      {tool.status}
                    </Text>
                  </View>
                )}
              </View>
              {tool.type && <Text style={styles.toolCallEndpoint}>Type: {tool.type}</Text>}
              {tool.timestamp && <Text style={styles.toolCallTime}>{new Date(tool.timestamp).toLocaleTimeString()}</Text>}
            </View>
          ))}
        </ExpandableSection>
      )}

      {/* Diagnostics */}
      <ExpandableSection
        title="Diagnostics"
        expanded={expandedSections.has('diagnostics')}
        onToggle={() => toggleSection('diagnostics')}
      >
        <AnalysisInfoRow label="Call ID" value={call.id || 'N/A'} />
        <AnalysisInfoRow label="Assistant ID" value={call.assistantId || 'N/A'} />
        {call.phoneNumberId && (
          <AnalysisInfoRow label="Phone Number ID" value={call.phoneNumberId} />
        )}
        {call.endedReason && (
          <AnalysisInfoRow label="End Reason" value={String(call.endedReason).replace(/_/g, ' ')} />
        )}
        {call.status && (
          <AnalysisInfoRow label="Status" value={String(call.status)} />
        )}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataTitle}>Full Metadata</Text>
          {Object.keys(fullMetadata).length > 0 ? (
            <>
              <ScrollView style={styles.metadataScrollView}>
                <Text style={styles.metadataText}>
                  {JSON.stringify(fullMetadata, null, 2)}
                </Text>
              </ScrollView>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopy(JSON.stringify(fullMetadata, null, 2))}
              >
                <MaterialCommunityIcons name="content-copy" size={18} color="#FFFFFF" />
                <Text style={styles.copyButtonText}>Copy Metadata</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptyText}>No metadata available</Text>
          )}
        </View>
      </ExpandableSection>
    </View>
  )
}

// Helper Components for Analysis Tab
function LatencyMetric({ label, value, color }: { label: string; value?: number; color: string }) {
  if (value === undefined || value === null) return null
  
  return (
    <View style={styles.latencyMetricItem}>
      <View style={styles.latencyMetricHeader}>
        <View style={[styles.latencyMetricDot, { backgroundColor: color }]} />
        <Text style={styles.latencyMetricLabel}>{label}</Text>
        <Text style={styles.latencyMetricValue}>{value.toFixed(0)}ms</Text>
      </View>
    </View>
  )
}

function AnalysisInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

// Enhanced Transcript Tab Component
function TranscriptTab({
  call,
  transcript,
  summary,
  primaryIntent,
}: {
  call: VapiCall
  transcript: string
  summary: string | null
  primaryIntent: string | null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const scrollViewRef = useRef<ScrollView>(null)

  // Parse messages from VAPI call
  const parsedMessages = useMemo(() => {
    const messages: Array<{
      role: string
      speaker: string
      message: string
      timestamp: string
      secondsFromStart: number
      isHighlighted?: boolean
      highlightType?: 'intent' | 'tool' | 'escalation'
    }> = []

    // Use artifact.messages if available (more detailed), otherwise use messages
    const sourceMessages = call?.artifact?.messages || call?.messages || []

    sourceMessages.forEach((msg: any) => {
      const role = msg.role || 'unknown'
      
      // Skip system messages/prompts
      if (role === 'system' || role === 'system-prompt') {
        return
      }
      
      const speakerLabel = msg.speakerLabel || role
      
      // Determine speaker display name
      let speaker = 'Unknown'
      if (role === 'user' || speakerLabel?.toLowerCase().includes('user') || speakerLabel?.toLowerCase().includes('caller')) {
        speaker = 'Caller'
      } else if (role === 'assistant' || speakerLabel?.toLowerCase().includes('assistant') || speakerLabel?.toLowerCase().includes('ai')) {
        speaker = 'AI Assistant'
      } else {
        speaker = speakerLabel || role.charAt(0).toUpperCase() + role.slice(1)
      }

      // Format timestamp
      const secondsFromStart = msg.secondsFromStart || 0
      const minutes = Math.floor(secondsFromStart / 60)
      const seconds = Math.floor(secondsFromStart % 60)
      const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`

      // Check for highlights
      const messageText = msg.message || ''
      let isHighlighted = false
      let highlightType: 'intent' | 'tool' | 'escalation' | undefined = undefined

      // Check for intent mentions
      if (primaryIntent && messageText.toLowerCase().includes(primaryIntent.toLowerCase())) {
        isHighlighted = true
        highlightType = 'intent'
      }

      // Check for tool usage markers
      const toolKeywords = ['calendar', 'booked', 'scheduled', 'appointment', 'created', 'updated']
      if (toolKeywords.some(keyword => messageText.toLowerCase().includes(keyword))) {
        isHighlighted = true
        highlightType = 'tool'
      }

      // Check for escalation points
      const escalationKeywords = ['transfer', 'escalate', 'manager', 'supervisor', 'human', 'agent']
      if (escalationKeywords.some(keyword => messageText.toLowerCase().includes(keyword))) {
        isHighlighted = true
        highlightType = 'escalation'
      }

      messages.push({
        role,
        speaker,
        message: messageText,
        timestamp,
        secondsFromStart,
        isHighlighted,
        highlightType,
      })
    })

    return messages
  }, [call, primaryIntent])

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return parsedMessages
    const query = searchQuery.toLowerCase()
    return parsedMessages.filter(
      (msg) =>
        msg.message.toLowerCase().includes(query) ||
        msg.speaker.toLowerCase().includes(query) ||
        msg.timestamp.includes(query)
    )
  }, [parsedMessages, searchQuery])

  // Get recording URL
  const recordingUrl =
    call?.artifact?.recording?.stereoUrl ||
    call?.artifact?.stereoRecordingUrl ||
    call?.artifact?.recordingUrl ||
    call?.recordingUrl ||
    null

  // Handle copy transcript
  const handleCopyTranscript = async () => {
    const transcriptText = parsedMessages
      .map((msg) => `[${msg.timestamp}] ${msg.speaker}: ${msg.message}`)
      .join('\n\n')
    
    await Clipboard.setStringAsync(transcriptText)
    Alert.alert('Copied', 'Transcript copied to clipboard')
  }

  // Handle download transcript as text
  const handleDownloadTxt = async () => {
    const transcriptText = `Call Transcript\nDate: ${call?.startedAt ? formatDateTime(call.startedAt) : 'N/A'}\n\n${parsedMessages
      .map((msg) => `[${msg.timestamp}] ${msg.speaker}: ${msg.message}`)
      .join('\n\n')}`
    
    // For now, copy to clipboard and show alert (in a real app, use expo-file-system)
    await Clipboard.setStringAsync(transcriptText)
    Alert.alert(
      'Download',
      'Transcript copied to clipboard. In a full implementation, this would download as a .txt file.',
      [{ text: 'OK' }]
    )
  }

  // Handle download transcript as PDF (opens URL)
  const handleDownloadPdf = () => {
    // For PDF, we'd need a backend service or library
    // For now, inform the user
    Alert.alert(
      'PDF Download',
      'PDF generation requires additional setup. The transcript has been copied to clipboard.',
      [{ text: 'OK' }]
    )
    handleCopyTranscript()
  }

  // Highlight search matches in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <Text key={index} style={styles.searchHighlight}>
            {part}
          </Text>
        )
      }
      return part
    })
  }

  return (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="rgba(255, 255, 255, 0.7)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transcript..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Audio Player */}
      {recordingUrl && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audio Playback</Text>
          <AudioPlayer
            recordingUrl={recordingUrl}
            duration={call?.endedAt && call?.startedAt
              ? Math.floor((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
              : undefined
            }
            theme="gradient"
          />
        </View>
      )}

      {/* Transcript Viewer */}
      <View style={styles.card}>
        <View style={styles.transcriptHeader}>
          <Text style={styles.cardTitle}>Transcript</Text>
          <View style={styles.transcriptActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopyTranscript}>
              <MaterialCommunityIcons name="content-copy" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadTxt}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPdf}>
              <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {parsedMessages.length === 0 ? (
          <Text style={styles.emptyText}>No transcript available</Text>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.transcriptScrollView}
            showsVerticalScrollIndicator={false}
          >
            {filteredMessages.map((msg, index) => {
              const isCaller = msg.speaker === 'Caller'
              return (
                <View
                  key={index}
                  style={[
                    styles.messageRow,
                    msg.isHighlighted && styles.highlightedMessage,
                    msg.highlightType === 'intent' && styles.intentHighlight,
                    msg.highlightType === 'tool' && styles.toolHighlight,
                    msg.highlightType === 'escalation' && styles.escalationHighlight,
                  ]}
                >
                  {/* Timestamp */}
                  <Text style={styles.timestamp}>{msg.timestamp}</Text>

                  {/* Speaker Label */}
                  <View
                    style={[
                      styles.speakerBadge,
                      isCaller ? styles.callerBadge : styles.assistantBadge,
                    ]}
                  >
                    <Text style={styles.speakerText}>{msg.speaker}</Text>
                  </View>

                  {/* Message Text */}
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>
                      {searchQuery ? highlightText(msg.message, searchQuery) : msg.message}
                    </Text>
                  </View>

                  {/* Highlight Indicators */}
                  {msg.highlightType === 'tool' && (
                    <View style={styles.highlightIndicator}>
                      <MaterialCommunityIcons name="calendar-check" size={16} color="#4CAF50" />
                      <Text style={styles.highlightText}>📅 Calendar booked here</Text>
                    </View>
                  )}
                  {msg.highlightType === 'escalation' && (
                    <View style={styles.highlightIndicator}>
                      <MaterialCommunityIcons name="account-switch" size={16} color="#FF9800" />
                      <Text style={styles.highlightText}>Escalation point</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </ScrollView>
        )}

        {searchQuery && filteredMessages.length === 0 && (
          <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
        )}
      </View>
    </View>
  )
}

export default function CallDetailTestScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: call, isLoading, error } = useVapiCall(id)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Fetch assistant details if assistantId is available but assistant object is not populated
  const assistantId = call?.assistantId
  const validAssistantId = assistantId && isValidUUID(assistantId) ? assistantId : null
  const { data: assistantData } = useVapiAssistant(
    validAssistantId && !call?.assistant?.name ? validAssistantId : undefined
  )

  // Get assistant name from call object or fetched assistant data
  const assistantName = useMemo(() => {
    if (call?.assistant?.name) return call.assistant.name
    if (assistantData?.name) return assistantData.name
    return null
  }, [call?.assistant?.name, assistantData?.name])

  // Calculate duration
  const duration = useMemo(() => {
    if (call?.startedAt && call?.endedAt) {
      const start = new Date(call.startedAt).getTime()
      const end = new Date(call.endedAt).getTime()
      return Math.floor((end - start) / 1000)
    }
    return 0
  }, [call?.startedAt, call?.endedAt])

  // Get customer number
  const customerNumber = useMemo(() => {
    if (call?.customer?.number) return call.customer.number
    if (call?.phoneNumber?.number) return call.phoneNumber.number
    return 'Unknown'
  }, [call])

  // Get cost
  const cost = useMemo(() => {
    return call?.cost || call?.costBreakdown?.total || 0
  }, [call])

  // Get transcript
  const transcript = useMemo(() => {
    return call?.artifact?.transcript || call?.messages?.map(m => `${m.role}: ${m.message}`).join('\n') || 'No transcript available'
  }, [call])

  // Get summary
  const summary = useMemo(() => {
    return call?.analysis?.summary || null
  }, [call])

  // Extract client info - prioritize VAPI customer object, then extract from summary/transcript
  const clientInfo = useMemo(() => {
    const info: { name?: string; phone?: string; email?: string; location?: string } = {}
    
    // First, check VAPI customer object (most reliable)
    if (call?.customer?.name) {
      info.name = call.customer.name
    }
    if (call?.customer?.email) {
      info.email = call.customer.email
    }
    if (call?.customer?.number) {
      info.phone = call.customer.number
    }
    
    // Also check structured outputs for extracted data
    // structuredOutputs can be an object with nested properties
    if (call?.artifact?.structuredOutputs) {
      const structured = call.artifact.structuredOutputs
      // Handle both flat and nested structures
      const flattenStructured = (obj: any, prefix = ''): any => {
        const result: any = {}
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flattenStructured(obj[key], prefix + key + '.'))
          } else {
            result[prefix + key] = obj[key]
          }
        }
        return result
      }
      const flatStructured = flattenStructured(structured)
      
      // Check common field names
      const nameFields = ['name', 'customerName', 'callerName', 'clientName', 'customer.name', 'caller.name']
      const emailFields = ['email', 'customerEmail', 'callerEmail', 'customer.email', 'caller.email']
      const phoneFields = ['phone', 'phoneNumber', 'customerPhone', 'callerPhone', 'customer.phone', 'caller.phone']
      const addressFields = ['address', 'location', 'street', 'customerAddress', 'callerAddress', 'customer.address', 'caller.address']
      
      for (const field of nameFields) {
        if (flatStructured[field] && typeof flatStructured[field] === 'string' && !info.name) {
          info.name = flatStructured[field]
          break
        }
      }
      
      for (const field of emailFields) {
        if (flatStructured[field] && typeof flatStructured[field] === 'string' && !info.email) {
          info.email = flatStructured[field]
          break
        }
      }
      
      for (const field of phoneFields) {
        if (flatStructured[field] && typeof flatStructured[field] === 'string' && !info.phone) {
          info.phone = flatStructured[field]
          break
        }
      }
      
      for (const field of addressFields) {
        if (flatStructured[field] && typeof flatStructured[field] === 'string' && !info.location) {
          info.location = flatStructured[field]
          break
        }
      }
    }
    
    // Check structured data from analysis
    if (call?.analysis?.structuredData) {
      const structured = call.analysis.structuredData
      if (typeof structured === 'object' && structured !== null) {
        // Handle both flat and nested structures
        const flattenStructured = (obj: any, prefix = ''): any => {
          const result: any = {}
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              Object.assign(result, flattenStructured(obj[key], prefix + key + '.'))
            } else {
              result[prefix + key] = obj[key]
            }
          }
          return result
        }
        const flatStructured = flattenStructured(structured)
        
        // Check common field names
        if (flatStructured.name && !info.name) info.name = flatStructured.name
        if (flatStructured.email && !info.email) info.email = flatStructured.email
        if (flatStructured.phone && !info.phone) info.phone = flatStructured.phone
        if (flatStructured.address && !info.location) info.location = flatStructured.address
        if (flatStructured.location && !info.location) info.location = flatStructured.location
      }
    }
    
    // Extract from summary/transcript as fallback using utility function
    const extracted = extractClientInfo(
      transcript === 'No transcript available' ? null : transcript, 
      summary, 
      info.phone || customerNumber
    )
    
    // Merge extracted info (only fill in missing fields)
    if (!info.name && extracted.name) info.name = extracted.name
    if (!info.email && extracted.email) info.email = extracted.email
    if (!info.phone && extracted.phone) info.phone = extracted.phone
    if (!info.location && extracted.location) info.location = extracted.location
    
    return info
  }, [call?.customer, call?.artifact?.structuredOutputs, call?.analysis?.structuredData, transcript, summary, customerNumber])

  // Extract highlights
  const highlights = useMemo(() => {
    if (!transcript && !summary) return {}
    return extractHighlights(transcript === 'No transcript available' ? null : transcript, summary, call?.assistant?.name)
  }, [transcript, summary, call?.assistant?.name])

  // Determine call status
  const callStatus = useMemo(() => {
    if (!call) return null
    const status = call.status
    const endedReason = call.endedReason || ''
    
    if (status === 'ended' && !endedReason.includes('error') && !endedReason.includes('failed')) {
      if (call.artifact?.transfers && call.artifact.transfers.length > 0) {
        return 'transferred'
      }
      return 'completed'
    }
    if (endedReason.includes('error') || endedReason.includes('failed') || status === 'failed') {
      return 'error'
    }
    if (status === 'ended' && (endedReason.includes('dropped') || endedReason.includes('hangup'))) {
      return 'dropped'
    }
    return status || 'completed'
  }, [call])

  // Determine if resolved
  const isResolved = useMemo(() => {
    if (call?.analysis?.successEvaluation !== undefined) {
      return call.analysis.successEvaluation === true || call.analysis.successEvaluation === 'true'
    }
    // Fallback: if call completed successfully, assume resolved
    return callStatus === 'completed' || callStatus === 'transferred'
  }, [call?.analysis?.successEvaluation, callStatus])

  // Get primary intent
  const primaryIntent = useMemo(() => {
    if (highlights.intent) return highlights.intent
    // Try to extract from structured data
    if (call?.analysis?.structuredData) {
      const structured = call.analysis.structuredData
      if (structured.intent) return structured.intent
      if (structured.purpose) return structured.purpose
    }
    // Try summary analysis
    if (summary) {
      const summaryLower = summary.toLowerCase()
      if (summaryLower.includes('appointment') || summaryLower.includes('schedule')) return 'Book Appointment'
      if (summaryLower.includes('quote') || summaryLower.includes('estimate')) return 'Get Quote'
      if (summaryLower.includes('inspection')) return 'Request Inspection'
      if (summaryLower.includes('repair')) return 'Repair Request'
    }
    return null
  }, [highlights.intent, call?.analysis?.structuredData, summary])

  // Build call flow summary
  const callFlow = useMemo(() => {
    const flow: string[] = []
    if (call?.startedAt) flow.push('Call started')
    if (primaryIntent) flow.push(`Intent identified (${primaryIntent})`)
    // Check for tool usage
    if (call?.messages?.some(m => m.role === 'assistant' && m.message?.toLowerCase().includes('calendar'))) {
      flow.push('Calendar tool used')
    }
    if (primaryIntent === 'Book Appointment' && isResolved) {
      flow.push('Appointment scheduled')
    }
    if (callStatus === 'transferred') {
      flow.push('Call transferred')
    }
    if (call?.endedAt) {
      if (isResolved || callStatus === 'completed') {
        flow.push('Call ended successfully')
      } else {
        flow.push('Call ended')
      }
    }
    return flow
  }, [call, primaryIntent, isResolved, callStatus])

  // Health signals
  const healthSignals = useMemo(() => {
    const signals: { type: 'good' | 'warning'; icon: string; label: string }[] = []
    const perfMetrics = call?.artifact?.performanceMetrics
    
    // Audio quality (check if transcriber worked)
    if (transcript && transcript !== 'No transcript available' && transcript.length > 50) {
      signals.push({ type: 'good', icon: 'microphone-outline', label: 'Clear audio' })
    }
    
    // Response speed (check average latency)
    if (perfMetrics?.turnLatencyAverage && perfMetrics.turnLatencyAverage < 2000) {
      signals.push({ type: 'good', icon: 'lightning-bolt-outline', label: 'Fast responses' })
    } else if (perfMetrics?.turnLatencyAverage && perfMetrics.turnLatencyAverage > 5000) {
      signals.push({ type: 'warning', icon: 'timer-sand', label: 'Slow responses' })
    }
    
    // Escalation (only show if there was an issue)
    if (callStatus === 'error' || !isResolved) {
      signals.push({ type: 'warning', icon: 'alert-circle', label: 'Issues detected' })
    } else if (callStatus !== 'transferred') {
      signals.push({ type: 'good', icon: 'handshake-outline', label: 'No escalation needed' })
    }
    
    return signals
  }, [call, transcript, callStatus, isResolved])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !call) {
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
            <Text style={styles.title}>Call Details</Text>
            <View style={styles.placeholder} />
          </View>
          <ErrorMessage error={error || new Error('Call not found')} onRetry={() => {}} />
        </LinearGradient>
      </View>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'information-outline' },
    { id: 'transcript', label: 'Transcript', icon: 'text-box-outline' },
    { id: 'cost', label: 'Cost', icon: 'currency-usd' },
    { id: 'analysis', label: 'Analysis', icon: 'chart-line' },
  ]

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#7A9CC6', '#8BA5C4', '#9A94B8', '#8B8BA3', '#A09CB2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Call Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              call={call}
              callStatus={callStatus}
              duration={duration}
              customerNumber={customerNumber}
              clientInfo={clientInfo}
              summary={summary}
              isResolved={isResolved}
              primaryIntent={primaryIntent}
              callFlow={callFlow}
              healthSignals={healthSignals}
              assistantName={assistantName}
            />
          )}

          {activeTab === 'transcript' && (
            <TranscriptTab
              call={call}
              transcript={transcript}
              summary={summary}
              primaryIntent={primaryIntent}
            />
          )}

          {activeTab === 'cost' && (
            <CostTab call={call} duration={duration} />
          )}

          {activeTab === 'analysis' && (
            <AnalysisTab call={call} />
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 2,
    justifyContent: 'flex-end',
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 3,
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
  transcriptContainer: {
    maxHeight: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transcriptText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    padding: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusBadgeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  outcomeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  outcomeChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  outcomeChipLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontWeight: '500',
  },
  outcomeChipValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  flowContainer: {
    paddingLeft: 12,
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  flowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    marginTop: 4,
    zIndex: 1,
  },
  flowLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  flowText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  healthSignalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  healthSignal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  healthSignalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  summarySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  // Transcript Tab Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transcriptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  transcriptScrollView: {
    maxHeight: 500,
  },
  messageRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  speakerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  callerBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.5)',
  },
  assistantBadge: {
    backgroundColor: 'rgba(156, 39, 176, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.5)',
  },
  speakerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageContainer: {
    marginTop: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  searchHighlight: {
    backgroundColor: 'rgba(255, 235, 59, 0.4)',
    fontWeight: '600',
  },
  highlightedMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  intentHighlight: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  toolHighlight: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  escalationHighlight: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  highlightIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  highlightText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  // Cost Tab Styles
  totalCostLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  totalCostValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  totalCostSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  costBreakdownItem: {
    marginBottom: 20,
  },
  costBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costBreakdownLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  costBreakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  costBreakdownAmount: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  costBreakdownPercentage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    minWidth: 45,
    textAlign: 'right',
  },
  costProgressBarContainer: {
    marginTop: 4,
  },
  costProgressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  costProgressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  usageLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  usageValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Analysis Tab Styles
  latencySummary: {
    marginBottom: 16,
  },
  latencySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  latencySummaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  latencySummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  latencyBreakdown: {
    marginTop: 16,
  },
  latencyBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  latencyMetricItem: {
    marginBottom: 12,
  },
  latencyMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  latencyMetricDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  latencyMetricLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  latencyMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  latencyTurnItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  latencyTurnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  latencyTurnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  latencyTurnTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  latencyTurnTimestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  latencyTurnDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  latencyTurnDetail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toolCallItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  toolCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusBadgeTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolCallEndpoint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  toolCallTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  analysisResultItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  analysisResultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  analysisResultValue: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  metadataSection: {
    marginTop: 16,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  metadataScrollView: {
    maxHeight: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'rgba(255, 255, 255, 0.8)',
  },
})

