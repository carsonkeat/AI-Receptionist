/**
 * Common query builders and filters
 */

import { supabase } from '@/lib/supabase/client'

export const buildCallsQuery = (filters?: {
  receptionistId?: string
  label?: string
  startDate?: Date
  endDate?: Date
}) => {
  let query = supabase.from('calls').select('*')

  if (filters?.receptionistId) {
    query = query.eq('receptionist_id', filters.receptionistId)
  }

  if (filters?.label) {
    query = query.eq('label', filters.label)
  }

  if (filters?.startDate) {
    query = query.gte('timestamp', filters.startDate.toISOString())
  }

  if (filters?.endDate) {
    query = query.lte('timestamp', filters.endDate.toISOString())
  }

  return query.order('timestamp', { ascending: false })
}

