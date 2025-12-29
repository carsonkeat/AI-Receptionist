/**
 * Metrics API calls
 */

import { supabase } from '@/lib/supabase/client'
import type { UserMetrics, ReceptionistMetrics } from '@/types/api'

export const getUserMetrics = async (userId: string): Promise<UserMetrics | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_metrics', {
      user_uuid: userId,
    })

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        total_minutes_used: 0,
        total_cost: 0,
        cost_per_minute: 0,
        total_calls: 0,
      }
    }

    const metrics = data[0]
    return {
      total_minutes_used: Number(metrics.total_minutes_used) || 0,
      total_cost: Number(metrics.total_cost) || 0,
      cost_per_minute: Number(metrics.cost_per_minute) || 0,
      total_calls: Number(metrics.total_calls) || 0,
      last_updated: metrics.last_updated || undefined,
    }
  } catch (error) {
    console.error('Error fetching user metrics:', error)
    throw error
  }
}

export const getReceptionistMetrics = async (receptionistId: string): Promise<ReceptionistMetrics | null> => {
  try {
    const { data, error } = await supabase.rpc('get_receptionist_metrics', {
      receptionist_uuid: receptionistId,
    })

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        minutes_used: 0,
        total_cost: 0,
        cost_per_minute: 0,
        calls_handled: 0,
      }
    }

    const metrics = data[0]
    return {
      minutes_used: Number(metrics.minutes_used) || 0,
      total_cost: Number(metrics.total_cost) || 0,
      cost_per_minute: Number(metrics.cost_per_minute) || 0,
      calls_handled: Number(metrics.calls_handled) || 0,
    }
  } catch (error) {
    console.error('Error fetching receptionist metrics:', error)
    throw error
  }
}

