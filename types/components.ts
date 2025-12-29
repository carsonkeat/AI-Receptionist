/**
 * Component prop types
 */

import type { Call, CallLabel, Receptionist, UserMetrics, ReceptionistMetrics } from './database'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export interface CallListItemProps {
  call: Call
  onPress?: (call: Call) => void
}

export interface CallDetailViewProps {
  callId: string
}

export interface CallTranscriptProps {
  transcript: string | null
}

export interface ReceptionistCardProps {
  receptionist: Receptionist
}

export interface ReceptionistStatusProps {
  status: 'active' | 'inactive'
  onToggle?: (status: 'active' | 'inactive') => void
  loading?: boolean
}

export interface SummaryCardsProps {
  metrics: UserMetrics | null
  loading?: boolean
}

export interface UsageBreakdownProps {
  dateRange?: 'today' | '7days' | '30days'
  onDateRangeChange?: (range: 'today' | '7days' | '30days') => void
}

