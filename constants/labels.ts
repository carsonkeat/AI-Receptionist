/**
 * Call label constants
 */

import type { CallLabel } from '@/types/database'

export const CALL_LABELS: Record<CallLabel, { label: string; color: string }> = {
  lead: {
    label: 'Lead',
    color: '#4CAF50', // Green
  },
  spam: {
    label: 'Spam',
    color: '#F44336', // Red
  },
  appointment: {
    label: 'Appointment',
    color: '#2196F3', // Blue
  },
  other: {
    label: 'Other',
    color: '#9E9E9E', // Gray
  },
}

export const CALL_LABEL_OPTIONS: { value: CallLabel; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'spam', label: 'Spam' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'other', label: 'Other' },
]

