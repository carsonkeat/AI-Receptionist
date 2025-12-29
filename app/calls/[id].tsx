/**
 * Call detail screen with tabs
 */

import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'react-native'
import { useVapiCall } from '@/hooks/useVapi'
import { LoadingSpinner, ErrorMessage } from '@/components/common'
import { formatDateTime, formatDuration } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import { formatPhoneNumber, maskPhoneNumber } from '@/lib/utils/phone'
import { extractHighlights, getSmartCallOutcome, extractClientInfo } from '@/lib/utils/callHighlights'
import { AudioPlayer } from '@/components/call/AudioPlayer'
import type { VapiCall } from '@/lib/api/vapi'

type Tab = 'overview' | 'transcript' | 'cost' | 'advanced'

// Extended call data structure based on VAPI metadata
interface ExtendedCallData {
  id: string
  caller_number: string
  timestamp: string
  duration_seconds: number
  minutes_billed: number
  cost: number
  label: string
  transcript: string | null
  metadata: any // VAPI metadata
  
  // Derived from metadata
  status?: string
  call_type?: 'webCall' | 'phoneCall'
  assistant_name?: string
  recording_url?: string | null
  
  // Cost breakdown from VAPI
  cost_breakdown?: {
    total?: number
    stt?: number
    llm?: number
    tts?: number
    vapi?: number
    transport?: number
    voice?: number
    model?: number
    telephony?: number
    analysis_summary?: number
    analysis_structured_output?: number
    analysis_success_evaluation?: number
  }
  
  // Performance metrics from VAPI
  performance_metrics?: {
    model_latency_average?: number
    voice_latency_average?: number
    transcriber_latency_average?: number
    turn_latency_average?: number
    num_assistant_interrupted?: number
    num_user_interrupted?: number
    turn_latencies?: number[]
    endpointing_latency?: number
    from_transport_latency?: number
    to_transport_latency?: number
  }
  
  // Detailed latency breakdown with timestamps
  latency_breakdown?: Array<{
    turn: number
    role: string
    timestamp: string
    time_relative: number
    duration?: number
    model_latency?: number
    voice_latency?: number
    transcriber_latency?: number
  }>
  
  detailed_latencies?: any
  
  // Outcome from VAPI
  summary?: string
  success_evaluation?: string | boolean
  
  // Routing from VAPI
  transfers?: Array<{
    transferred: boolean
    transferred_to?: string | null
    transfer_time?: string | null
  }>
  
  // Assistant info
  assistant_info?: {
    name?: string
    model?: string
    model_provider?: string
    voice_id?: string
    voice_provider?: string
    stt_provider?: string
    stt_model?: string
  }
  
  // Tool calls
  tool_calls?: Array<{
    name?: string
    endpoint?: string
    status?: string
    time_ms?: number
  }>
  
  // Structured outputs
  structured_outputs?: any
}

// Helper function to convert VAPI call to ExtendedCallData format
function convertVapiCallToExtendedData(call: VapiCall): ExtendedCallData {
  // Calculate duration
  let durationSeconds = 0
  if (call.startedAt && call.endedAt) {
    const start = new Date(call.startedAt).getTime()
    const end = new Date(call.endedAt).getTime()
    durationSeconds = Math.floor((end - start) / 1000)
  }
  
  // Calculate minutes billed (round up)
  const minutesBilled = Math.ceil(durationSeconds / 60)
  
  // Get customer number
  const customerNumber = call.customer?.number || call.phoneNumber?.number || 'Unknown'
  
  // Get transcript
  const transcript = call.artifact?.transcript || 
    call.messages?.map(m => `${m.role}: ${m.message}`).join('\n') || 
    null
  
  // Get recording URL
  const recordingUrl = call.artifact?.recording?.combinedUrl || 
    call.artifact?.recording?.mono?.combinedUrl || 
    call.artifact?.recordingUrl ||
    call.recordingUrl ||
    null
  
  // Get cost breakdown
  const costBreakdown = call.costBreakdown ? {
    total: call.costBreakdown.total || call.cost || 0,
    stt: call.costBreakdown.stt || 0,
    llm: call.costBreakdown.llm || 0,
    tts: call.costBreakdown.tts || 0,
    vapi: call.costBreakdown.vapi || 0,
    transport: call.costBreakdown.transport || 0,
    analysis_summary: call.costBreakdown.analysisCostBreakdown?.summary || 0,
    analysis_structured_output: call.costBreakdown.analysisCostBreakdown?.structuredData || 0,
    analysis_success_evaluation: call.costBreakdown.analysisCostBreakdown?.successEvaluation || 0,
  } : {}
  
  // Get performance metrics
  const performanceMetrics = call.artifact?.performanceMetrics ? {
    model_latency_average: call.artifact.performanceMetrics.modelLatencyAverage,
    voice_latency_average: call.artifact.performanceMetrics.voiceLatencyAverage,
    transcriber_latency_average: call.artifact.performanceMetrics.transcriberLatencyAverage,
    turn_latency_average: call.artifact.performanceMetrics.turnLatencyAverage,
    num_assistant_interrupted: call.artifact.performanceMetrics.numAssistantInterrupted,
    num_user_interrupted: call.artifact.performanceMetrics.numUserInterrupted,
    endpointing_latency: call.artifact.performanceMetrics.endpointingLatencyAverage,
    from_transport_latency: call.artifact.performanceMetrics.fromTransportLatencyAverage,
    to_transport_latency: call.artifact.performanceMetrics.toTransportLatencyAverage,
  } : {}
  
  // Extract tool calls from messages if available
  const toolCalls: Array<{ name?: string; endpoint?: string; status?: string; time_ms?: number }> = []
  
  // Get assistant info
  const assistantInfo = call.assistant ? {
    name: call.assistant.name,
    model: call.assistant.model?.model,
    model_provider: call.assistant.model?.provider,
    voice_id: call.assistant.voice?.voiceId,
    voice_provider: call.assistant.voice?.provider,
    stt_provider: call.assistant.transcriber?.provider,
    stt_model: call.assistant.transcriber?.speechModel,
  } : {}
  
  // Get transfers
  const transfers = call.artifact?.transfers?.map((transferId: string) => ({
    transferred: true,
    transferred_to: transferId,
    transfer_time: null,
  })) || []
  
  return {
    id: call.id,
    caller_number: customerNumber,
    timestamp: call.createdAt || call.startedAt || new Date().toISOString(),
    duration_seconds: durationSeconds,
    minutes_billed: minutesBilled,
    cost: call.cost || call.costBreakdown?.total || 0,
    label: 'other', // Default label, can be derived from analysis later
    transcript,
    metadata: call as any, // Store full VAPI call as metadata
    status: call.status || 'completed',
    call_type: call.type === 'webCall' ? 'webCall' : 'phoneCall',
    assistant_name: assistantInfo.name || 'Unavailable',
    recording_url: recordingUrl,
    cost_breakdown: costBreakdown,
    performance_metrics: performanceMetrics,
    latency_breakdown: [], // Can be extracted from artifact.performanceMetrics.turnLatencies
    summary: call.analysis?.summary || null,
    success_evaluation: call.analysis?.successEvaluation,
    transfers,
    assistant_info: assistantInfo,
    tool_calls: toolCalls,
    structured_outputs: call.artifact?.structuredOutputs || null,
  }
}

export default function CallDetailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ id: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: vapiCall, isLoading, error, refetch } = useVapiCall(id || '')

  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [transcriptSearch, setTranscriptSearch] = useState('')

  // Convert VAPI call to ExtendedCallData format
  const callData: ExtendedCallData | null = useMemo(() => {
    if (vapiCall) {
      return convertVapiCallToExtendedData(vapiCall)
    }
    return null
  }, [vapiCall])

  const handleCopy = async (text: string) => {
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        // For web, use the native Clipboard API
        await navigator.clipboard.writeText(text)
      } else {
        // For mobile, use expo-clipboard
        await Clipboard.setStringAsync(text)
      }
      Alert.alert('Copied', 'Text copied to clipboard')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      Alert.alert('Error', 'Failed to copy to clipboard')
    }
  }

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would be implemented here')
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={() => refetch()} />
  }

  if (!callData) {
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Call not found</Text>
          </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Call Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Text 
            style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}
            allowFontScaling={false}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transcript' && styles.tabActive]}
          onPress={() => setActiveTab('transcript')}
          activeOpacity={0.7}
        >
          <Text 
            style={[styles.tabText, activeTab === 'transcript' && styles.tabTextActive]}
            allowFontScaling={false}
          >
            Transcript
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cost' && styles.tabActive]}
          onPress={() => setActiveTab('cost')}
          activeOpacity={0.7}
        >
          <Text 
            style={[styles.tabText, activeTab === 'cost' && styles.tabTextActive]}
            allowFontScaling={false}
          >
            Cost
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'advanced' && styles.tabActive]}
          onPress={() => setActiveTab('advanced')}
          activeOpacity={0.7}
        >
          <Text 
            style={[styles.tabText, activeTab === 'advanced' && styles.tabTextActive]}
            allowFontScaling={false}
          >
            Advanced
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && <OverviewTab callData={callData} />}
        {activeTab === 'transcript' && (
          <TranscriptTab
            callData={callData}
            searchText={transcriptSearch}
            onSearchChange={setTranscriptSearch}
            onCopy={handleCopy}
          />
        )}
        {activeTab === 'cost' && <CostTab callData={callData} />}
        {activeTab === 'advanced' && <AdvancedTab callData={callData} onCopy={handleCopy} />}
      </ScrollView>
      </LinearGradient>
    </View>
  )
}

// Overview Tab Component
function OverviewTab({ callData }: { callData: ExtendedCallData }) {
  const [filterText, setFilterText] = useState('')
  const [showOutcome, setShowOutcome] = useState(true)
  const [showHighlights, setShowHighlights] = useState(true)
  const [showClientInfo, setShowClientInfo] = useState(true)
  const [showCallDetails, setShowCallDetails] = useState(true)
  const [showSummary, setShowSummary] = useState(true)
  const [showRecording, setShowRecording] = useState(true)
  const [showRouting, setShowRouting] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const statusColors: Record<string, string> = {
    completed: '#4CAF50',
    ended: '#4CAF50',
    queued: '#FF9800',
    ringing: '#FF9800',
    'in-progress': '#2196F3',
    missed: '#FF9800',
    failed: '#F44336',
  }

  const status = callData.status || 'completed'
  const direction = callData.call_type === 'webCall' ? 'Inbound' : 'Inbound'
  
  // Extract outcome and highlights
  const metadata = (callData.metadata as Record<string, any>) || {}
  const summary = callData.summary || metadata.summary || metadata.analysis?.summary || 'No summary available'
  const successEvaluation = callData.success_evaluation !== undefined 
    ? callData.success_evaluation 
    : metadata.success_evaluation
  // Override label - always use 'other' instead of 'spam' for display purposes
  // The urgency indicator is sufficient for showing call quality
  let displayLabel = callData.label
  if (displayLabel === 'spam') {
    displayLabel = 'other' // Don't show spam label, just mark as 'other'
  }
  
  const outcome = getSmartCallOutcome(
    displayLabel, // Use corrected label
    successEvaluation,
    callData.transcript,
    summary
  )
  
  // Extract highlights, excluding assistant name if available
  const assistantName = callData.assistant_name || metadata.assistant_info?.name || 'Grace'
  const highlights = extractHighlights(callData.transcript, summary, assistantName)
  
  // Extract client information from transcript/summary
  const clientInfo = extractClientInfo(callData.transcript, summary, callData.caller_number)
  const transferred = callData.transfers && Array.isArray(callData.transfers) && callData.transfers.length > 0
  const transferInfo = callData.transfers?.[0]

  const outcomeColors: Record<string, string> = {
    lead: '#4CAF50',
    test: '#FF9800',
    appointment: '#2196F3',
    missed: '#9E9E9E',
    other: '#757575',
  }

  // Filter function to check if text matches filter
  const matchesFilter = (text: string): boolean => {
    if (!filterText.trim()) return true
    return text.toLowerCase().includes(filterText.toLowerCase())
  }

  // Filter highlights based on search
  const filteredHighlights = {
    ...highlights,
    keywords: highlights.keywords?.filter(kw => matchesFilter(kw)) || [],
  }

  // Check if any highlight should be shown
  const shouldShowHighlights = showHighlights && (
    (filteredHighlights.callerName && matchesFilter(filteredHighlights.callerName)) ||
    (filteredHighlights.address && matchesFilter(filteredHighlights.address)) ||
    (filteredHighlights.city && matchesFilter(filteredHighlights.city)) ||
    (filteredHighlights.intent && matchesFilter(filteredHighlights.intent)) ||
    (filteredHighlights.urgency && matchesFilter(filteredHighlights.urgency)) ||
    (filteredHighlights.keywords && filteredHighlights.keywords.length > 0)
  )

  // Check if client info should be shown
  const shouldShowClientInfo = showClientInfo && (
    clientInfo.name || clientInfo.phone || clientInfo.email || clientInfo.location
  ) && (
    !filterText.trim() ||
    (clientInfo.name && matchesFilter(clientInfo.name)) ||
    (clientInfo.phone && matchesFilter(clientInfo.phone)) ||
    (clientInfo.email && matchesFilter(clientInfo.email)) ||
    (clientInfo.location && matchesFilter(clientInfo.location))
  )

  // Check if summary should be shown
  const shouldShowSummary = showSummary && (!filterText.trim() || matchesFilter(summary))

  return (
    <View style={styles.tabContent}>
      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <MaterialCommunityIcons
            name={showFilters ? 'filter-off' : 'filter'}
            size={20}
            color="#007AFF"
          />
          <Text style={styles.filterToggleText}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>

        {showFilters && (
          <View style={styles.filterPanel}>
            {/* Search/Filter Input */}
            <View style={styles.filterInputContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#999999" style={styles.filterSearchIcon} />
              <TextInput
                style={styles.filterInput}
                placeholder="Search overview..."
                placeholderTextColor="#999999"
                value={filterText}
                onChangeText={setFilterText}
              />
              {filterText.length > 0 && (
                <TouchableOpacity onPress={() => setFilterText('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#999999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Section Toggles */}
            <View style={styles.filterToggles}>
              <Text style={styles.filterSectionTitle}>Show Sections:</Text>
              <FilterToggle label="Outcome Badge" value={showOutcome} onToggle={setShowOutcome} />
              <FilterToggle label="Call Highlights" value={showHighlights} onToggle={setShowHighlights} />
              <FilterToggle label="Client Information" value={showClientInfo} onToggle={setShowClientInfo} />
              <FilterToggle label="Call Details" value={showCallDetails} onToggle={setShowCallDetails} />
              <FilterToggle label="Summary" value={showSummary} onToggle={setShowSummary} />
              <FilterToggle label="Recording" value={showRecording} onToggle={setShowRecording} />
              <FilterToggle label="Routing" value={showRouting} onToggle={setShowRouting} />
            </View>
          </View>
        )}
      </View>

      {/* Smart Call Outcome Badge - Hide if outcome is "missed" or filtered */}
      {showOutcome && outcome.type !== 'missed' && (
        <View style={styles.outcomeBadge}>
          <View
            style={[
              styles.outcomeBadgeDot,
              { backgroundColor: outcomeColors[outcome.type] || '#757575' },
            ]}
          />
          <MaterialCommunityIcons
            name={outcome.icon as any}
            size={20}
            color={outcomeColors[outcome.type] || '#757575'}
          />
          <Text style={styles.outcomeBadgeText}>{outcome.label}</Text>
        </View>
      )}

      {/* Call Highlights */}
      {shouldShowHighlights && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Highlights</Text>
          
          {filteredHighlights.intent && matchesFilter(filteredHighlights.intent) && (
            <View style={styles.highlightBubble}>
              <MaterialCommunityIcons name="target" size={16} color="#007AFF" />
              <Text style={styles.highlightLabel}>Intent:</Text>
              <Text style={styles.highlightValue}>{filteredHighlights.intent}</Text>
            </View>
          )}

          {filteredHighlights.urgency && matchesFilter(filteredHighlights.urgency) && (
            <View style={styles.highlightBubble}>
              <MaterialCommunityIcons
                name={filteredHighlights.urgency === 'High' ? 'alert-circle' : 'information'}
                size={16}
                color={filteredHighlights.urgency === 'High' ? '#F44336' : '#FF9800'}
              />
              <Text style={styles.highlightLabel}>Urgency:</Text>
              <Text
                style={[
                  styles.highlightValue,
                  { color: filteredHighlights.urgency === 'High' ? '#F44336' : '#FF9800' },
                ]}
              >
                {filteredHighlights.urgency}
              </Text>
            </View>
          )}

          {filteredHighlights.callerName && matchesFilter(filteredHighlights.callerName) && (
            <View style={styles.highlightBubble}>
              <MaterialCommunityIcons name="account" size={16} color="#4CAF50" />
              <Text style={styles.highlightLabel}>Caller mentioned:</Text>
              <Text style={styles.highlightValue}>{filteredHighlights.callerName}</Text>
            </View>
          )}

          {(filteredHighlights.address || filteredHighlights.city) && 
           (matchesFilter(filteredHighlights.address || '') || matchesFilter(filteredHighlights.city || '')) && (
            <View style={styles.highlightBubble}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#9C27B0" />
              <Text style={styles.highlightLabel}>Location:</Text>
              <Text style={styles.highlightValue}>
                {[filteredHighlights.address, filteredHighlights.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {filteredHighlights.keywords && filteredHighlights.keywords.length > 0 && (
            <View style={styles.keywordsContainer}>
              {filteredHighlights.keywords.slice(0, 5).map((keyword, index) => (
                <View key={index} style={styles.keywordTag}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Client Information */}
      {shouldShowClientInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          {clientInfo.name && (
            <InfoRow label="Client Name" value={clientInfo.name} />
          )}
          {clientInfo.phone && (
            <InfoRow label="Phone Number" value={clientInfo.phone} />
          )}
          {clientInfo.email && (
            <InfoRow label="Email" value={clientInfo.email} />
          )}
          {clientInfo.location && (
            <InfoRow label="Location" value={clientInfo.location} />
          )}
        </View>
      )}

      {/* Overview Info */}
      {showCallDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Details</Text>
          <InfoRow label="Date & Time" value={formatDateTime(callData.timestamp || new Date().toISOString())} />
          <InfoRow label="Duration" value={formatDuration(callData.duration_seconds || 0)} />
          <InfoRow label="Caller Number" value={callData.caller_number && callData.caller_number !== 'Unknown' ? formatPhoneNumber(callData.caller_number) : 'Unknown'} />
          <InfoRow label="Assistant" value="Grace Assistant" />
        </View>
      )}

      {/* Call Summary */}
      {shouldShowSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Summary</Text>
          <View style={styles.bubble}>
            <Text style={styles.bubbleDescription}>{summary}</Text>
          </View>
        </View>
      )}

      {/* Recording Player */}
      {showRecording && callData.recording_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recording</Text>
          <AudioPlayer recordingUrl={callData.recording_url} duration={callData.duration_seconds} />
          <Text style={styles.consentText}>
            Recording available with caller consent for quality assurance purposes.
          </Text>
        </View>
      )}

      {/* Routing */}
      {showRouting && transferred && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routing</Text>
          <View style={styles.bubble}>
            <Text style={styles.bubbleLabel}>Transferred</Text>
            <Text style={styles.bubbleValue}>Yes</Text>
          </View>
          {transferInfo?.transferred_to && (
            <InfoRow label="Transferred To" value={transferInfo.transferred_to} />
          )}
          {transferInfo?.transfer_time && (
            <InfoRow label="Transfer Time" value={formatDateTime(transferInfo.transfer_time)} />
          )}
        </View>
      )}
    </View>
  )
}

// Transcript Tab Component
function TranscriptTab({
  callData,
  searchText,
  onSearchChange,
  onCopy,
}: {
  callData: ExtendedCallData
  searchText: string
  onSearchChange: (text: string) => void
  onCopy: (text: string) => void
}) {
  const transcript = callData.transcript || 'No transcript available.'

  const filteredTranscript = useMemo(() => {
    if (!searchText.trim()) return transcript
    const lines = transcript.split('\n')
    return lines
      .filter((line) => line.toLowerCase().includes(searchText.toLowerCase()))
      .join('\n')
  }, [transcript, searchText])

  return (
    <View style={styles.tabContent}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#999999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transcript..."
          placeholderTextColor="#999999"
          value={searchText}
          onChangeText={onSearchChange}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#999999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Transcript */}
      <View style={styles.transcriptContainer}>
        <View style={styles.transcriptHeader}>
          <Text style={styles.transcriptTitle}>Full Transcript</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => onCopy(transcript)}
          >
            <MaterialCommunityIcons name="content-copy" size={18} color="#007AFF" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.transcriptText}>{filteredTranscript}</Text>
      </View>

      {/* Recording Player is now in Overview tab */}
    </View>
  )
}

// Cost Tab Component
function CostTab({ callData }: { callData: ExtendedCallData }) {
  const costBreakdown = callData.cost_breakdown || {}
  const costPerMinute = callData.minutes_billed > 0 ? callData.cost / callData.minutes_billed : 0

  // VAPI cost breakdown categories
  const costCategories = [
    { label: 'STT (Speech-to-Text)', value: costBreakdown.stt || 0, key: 'stt' },
    { label: 'LLM', value: costBreakdown.llm || 0, key: 'llm' },
    { label: 'AI Host Platform', value: costBreakdown.vapi || 0, key: 'vapi' },
    { label: 'Analysis: Summary', value: costBreakdown.analysis_summary || 0, key: 'analysis_summary' },
    { label: 'Analysis: Structured Output', value: costBreakdown.analysis_structured_output || 0, key: 'analysis_structured' },
    { label: 'Analysis: Success Evaluation', value: costBreakdown.analysis_success_evaluation || 0, key: 'analysis_success' },
    { label: 'TTS (Voice)', value: costBreakdown.tts || costBreakdown.voice || 0, key: 'tts' },
    // Transport removed - duplicate of VAPI/AI Host Platform
  ].filter(cat => cat.value > 0) // Only show categories with costs

  return (
    <View style={styles.tabContent}>
      {/* Total Cost - Large Display */}
      <View style={styles.costHeader}>
        <Text style={styles.costLabel}>Total Cost</Text>
        <Text style={styles.costValue}>{formatCurrency(callData.cost)}</Text>
        <Text style={styles.costSubtext}>
          for {formatDuration(callData.duration_seconds || 0)} ({(callData.minutes_billed || 0).toFixed(2)} min billed)
        </Text>
      </View>

      {/* Cost Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
        {costCategories.length > 0 ? (
          costCategories.map((category) => {
            const percentage = callData.cost > 0 ? (category.value / callData.cost) * 100 : 0
            return (
              <View key={category.key} style={styles.costBreakdownItem}>
                <View style={styles.costBreakdownRow}>
                  <Text style={styles.costBreakdownLabel}>{category.label}</Text>
                  <View style={styles.costBreakdownRight}>
                    <Text style={styles.costBreakdownValue}>{formatCurrency(category.value)}</Text>
                    <Text style={styles.costBreakdownPercentage}>({percentage.toFixed(1)}%)</Text>
                  </View>
                </View>
                <View style={styles.costBreakdownBar}>
                  <View
                    style={[
                      styles.costBreakdownBarFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
              </View>
            )
          })
        ) : (
          <Text style={styles.noDataText}>No cost breakdown available</Text>
        )}
      </View>

      {/* Usage Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usage</Text>
        <InfoRow label="Duration" value={formatDuration(callData.duration_seconds)} />
        <InfoRow label="Minutes Billed" value={(callData.minutes_billed || 0).toFixed(2)} />
        <InfoRow label="Cost per Minute" value={formatCurrency(costPerMinute)} />
      </View>
    </View>
  )
}

// Advanced Tab Component
function AdvancedTab({
  callData,
  onCopy,
}: {
  callData: ExtendedCallData
  onCopy: (text: string) => void
}) {
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

  const assistantInfo = callData.assistant_info || {}
  const perfMetrics = callData.performance_metrics || {}
  const metadata = (callData.metadata as Record<string, any>) || {}
  const toolCalls = callData.tool_calls || []
  const latencyBreakdown = callData.latency_breakdown || []

  return (
    <View style={styles.tabContent}>
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
              {perfMetrics.turn_latency_average ? `${perfMetrics.turn_latency_average.toFixed(0)}ms` : 'N/A'}
            </Text>
          </View>
        </View>
        
        {/* Latency Breakdown */}
        <View style={styles.latencyBreakdown}>
          <Text style={styles.latencyBreakdownTitle}>Latency Breakdown</Text>
          <LatencyMetric
            label="Transcriber"
            value={perfMetrics.transcriber_latency_average}
            color="#FF9800"
          />
          <LatencyMetric
            label="LLM"
            value={perfMetrics.model_latency_average}
            color="#FFC107"
          />
          <LatencyMetric
            label="Voice"
            value={perfMetrics.voice_latency_average}
            color="#2196F3"
          />
          <LatencyMetric
            label="Turn"
            value={perfMetrics.turn_latency_average}
            color="#2196F3"
          />
          <LatencyMetric
            label="Endpointing"
            value={perfMetrics.endpointing_latency}
            color="#4CAF50"
          />
          <LatencyMetric
            label="From Transport"
            value={perfMetrics.from_transport_latency}
            color="#9C27B0"
          />
          <LatencyMetric
            label="To Transport"
            value={perfMetrics.to_transport_latency}
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
                    Turn {turn.turn} - {turn.role === 'user' ? 'User' : turn.role === 'bot' ? 'Assistant' : turn.role}
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
                {(turn.model_latency || turn.voice_latency || turn.transcriber_latency || turn.duration) && (
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
                    {turn.duration && (
                      <Text style={styles.latencyTurnDetail}>
                        Duration: {typeof turn.duration === 'number' ? turn.duration.toFixed(2) : turn.duration}s
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
            <Text style={styles.noDataText}>No detailed latency data available. This will appear for new calls after the webhook update.</Text>
          </View>
        )}
      </ExpandableSection>

      {/* AI & Models */}
      <ExpandableSection
        title="AI & Models Used"
        expanded={expandedSections.has('ai')}
        onToggle={() => toggleSection('ai')}
      >
        <InfoRow label="Model" value={assistantInfo.model || 'meta-llama/llama-4-maverick-17b-128e-instruct'} />
        <InfoRow label="Model Provider" value={assistantInfo.model_provider || 'groq'} />
        <InfoRow label="Voice Provider" value={assistantInfo.voice_provider || 'vapi'} />
        <InfoRow label="Voice Name" value={assistantInfo.voice_id || 'Kylie'} />
        <InfoRow label="Speech-to-Text Provider" value={assistantInfo.stt_provider || 'deepgram'} />
        <InfoRow label="STT Model" value={assistantInfo.stt_model || 'nova-3'} />
        <InfoRow label="Assistant Name" value={assistantInfo.name || 'Grace Assistant'} />
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
                      { backgroundColor: tool.status === 'Success' ? '#E8F5E9' : '#FFEBEE' },
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
              {tool.endpoint && <Text style={styles.toolCallEndpoint}>{tool.endpoint}</Text>}
              {tool.time_ms && <Text style={styles.toolCallTime}>{tool.time_ms} ms</Text>}
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
        <InfoRow label="Call ID" value={metadata.vapi_call_id || 'N/A'} />
        <InfoRow label="Assistant ID" value={metadata.vapi_assistant_id || 'N/A'} />
        {metadata.vapi_phone_number_id && (
          <InfoRow label="Phone Number ID" value={metadata.vapi_phone_number_id} />
        )}
        {metadata.ended_reason && (
          <InfoRow label="End Reason" value={String(metadata.ended_reason).replace(/_/g, ' ')} />
        )}
        {metadata.status && (
          <InfoRow label="Status" value={String(metadata.status)} />
        )}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataTitle}>Full Metadata</Text>
          <Text style={styles.metadataText}>
            {JSON.stringify(metadata, null, 2)}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => onCopy(JSON.stringify(metadata, null, 2))}
          >
            <MaterialCommunityIcons name="content-copy" size={18} color="#007AFF" />
            <Text style={styles.copyButtonText}>Copy Metadata</Text>
          </TouchableOpacity>
        </View>
      </ExpandableSection>
    </View>
  )
}

// Latency Metric Component
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

// Helper Components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

// Filter Toggle Component
function FilterToggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: (val: boolean) => void }) {
  return (
    <TouchableOpacity
      style={styles.filterToggleRow}
      onPress={() => onToggle(!value)}
      activeOpacity={0.7}
    >
      <View style={[styles.filterCheckbox, value && styles.filterCheckboxChecked]}>
        {value && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
      </View>
      <Text style={styles.filterToggleLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

// Cost breakdown styles will be added to the stylesheet

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
    <View style={styles.expandableSection}>
      <TouchableOpacity style={styles.expandableHeader} onPress={onToggle}>
        <Text style={styles.expandableTitle}>{title}</Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      {expanded && <View style={styles.expandableContent}>{children}</View>}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4,
    justifyContent: 'space-between',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 85,
  },
  tabActive: {
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  bubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bubbleLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: '500',
  },
  bubbleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bubbleDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    padding: 0,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  transcriptText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  consentText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  costHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  costLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  costValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  costSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  costDriverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  costDriverLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  costDriverValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expandableSection: {
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expandableContent: {
    padding: 16,
  },
  toolCallsSection: {
    marginTop: 16,
  },
  toolCallsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  toolCallItem: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  toolCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  toolCallEndpoint: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  toolCallTime: {
    fontSize: 12,
    color: '#999999',
  },
  webhookEvents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  webhookEventBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  webhookEventText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  errorSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginBottom: 4,
  },
  metadataSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  costBreakdownItem: {
    marginBottom: 16,
  },
  costBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  costBreakdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  costBreakdownLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  costBreakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  costBreakdownPercentage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  costBreakdownBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  costBreakdownBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  noDataText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  latencySummary: {
    marginBottom: 16,
  },
  latencySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  latencySummaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    fontSize: 14,
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
    gap: 8,
  },
  latencyMetricDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  latencyMetricLabel: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  latencyMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  latencyTurnItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: '#000000',
    flex: 1,
  },
  latencyTurnTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  latencyTurnTimestamp: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  latencyTurnDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  latencyTurnDetail: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  outcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  outcomeBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  outcomeBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  highlightBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  highlightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  keywordTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginBottom: 8,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  filterPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterSearchIcon: {
    marginRight: 8,
  },
  filterInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    padding: 0,
  },
  filterToggles: {
    marginTop: 8,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  filterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCheckboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterToggleLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  consentText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  toolCallItem: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  metadataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
})