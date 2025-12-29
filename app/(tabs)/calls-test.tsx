/**
 * Calls list screen - VAPI API version (test)
 * This uses VAPI API directly instead of Supabase
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVapiCalls } from '@/hooks/useVapi'
import { useReceptionists } from '@/hooks/useReceptionist'
import { LoadingSpinner, ErrorMessage } from '@/components/common'
import { formatDate } from '@/lib/utils/date'
import { formatCurrency } from '@/lib/utils/currency'
import type { VapiCall } from '@/lib/api/vapi'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Helper function to extract customer number from VAPI call
const getCustomerNumber = (call: VapiCall): string => {
  if (call.customer?.number) {
    return call.customer.number
  }
  if (call.type === 'inboundPhoneCall' || call.type === 'outboundPhoneCall') {
    return call.phoneNumber?.number || 'Unknown'
  }
  return 'Unknown'
}

// Helper function to calculate duration in minutes
const getDurationMinutes = (call: VapiCall): number => {
  if (call.startedAt && call.endedAt) {
    const start = new Date(call.startedAt).getTime()
    const end = new Date(call.endedAt).getTime()
    return (end - start) / 1000 / 60
  }
  return 0
}

export default function CallsTestScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data: receptionists } = useReceptionists()
  
  // Get Trusted KC Receptionist and its assistant ID
  const trustedKCReceptionist = useMemo(() => {
    return receptionists?.find(r => 
      r.name?.toLowerCase().includes('trusted') && 
      r.name?.toLowerCase().includes('kc')
    ) || receptionists?.[0]
  }, [receptionists])

  const assistantId = trustedKCReceptionist?.vapi_assistant_id

  // Fetch VAPI calls filtered by Trusted KC Assistant ID
  const { data: calls, isLoading, error, refetch } = useVapiCalls(
    assistantId ? { assistantId, limit: 1000 } : undefined
  )
  
  const [searchText, setSearchText] = useState('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Calculate padding to account for tab bar height (60px) + safe area bottom
  const tabBarHeight = 60 + insets.bottom

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetch()
    } catch (err) {
      console.error('Error refreshing calls:', err)
    }
    setRefreshing(false)
  }, [refetch])

  // Use VAPI API data - already filtered by assistant ID
  const allCalls = useMemo(() => {
    // Additional client-side filter to ensure only Trusted KC calls
    if (!assistantId || !calls) return []
    return calls.filter(call => call.assistantId === assistantId)
  }, [calls, assistantId])

  // Filter calls based on search and filters
  const filteredCalls = useMemo(() => {
    let filtered = [...allCalls]

    // Filter by search text (phone number or customer number)
    if (searchText.trim()) {
      filtered = filtered.filter((call) => {
        const customerNumber = getCustomerNumber(call)
        return customerNumber.toLowerCase().includes(searchText.toLowerCase())
      })
    }

    // Filter by month
    if (selectedMonth !== null) {
      filtered = filtered.filter((call) => {
        const callDate = call.createdAt ? new Date(call.createdAt) : new Date()
        return callDate.getMonth() === selectedMonth
      })
    }

    // Filter by specific date
    if (selectedDate) {
      filtered = filtered.filter((call) => {
        const callDate = call.createdAt ? new Date(call.createdAt) : new Date()
        return (
          callDate.getDate() === selectedDate.getDate() &&
          callDate.getMonth() === selectedDate.getMonth() &&
          callDate.getFullYear() === selectedDate.getFullYear()
        )
      })
    }

    return filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }, [allCalls, searchText, selectedMonth, selectedDate])

  // Group calls by month
  const groupedCalls = useMemo(() => {
    const groups: { [key: string]: VapiCall[] } = {}
    filteredCalls.forEach((call) => {
      const date = call.createdAt ? new Date(call.createdAt) : new Date()
      const monthKey = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(call)
    })
    return groups
  }, [filteredCalls])

  const clearFilters = () => {
    setSearchText('')
    setSelectedMonth(null)
    setSelectedDate(null)
  }

  const hasActiveFilters = searchText.trim() !== '' || selectedMonth !== null || selectedDate !== null

  if (isLoading && !allCalls.length) {
    return <LoadingSpinner />
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
        <Text style={styles.title}>Calls (test)</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search phone number..."
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#999999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="filter"
            size={20}
            color={hasActiveFilters ? '#FFFFFF' : '#000000'}
          />
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <View style={styles.filterDot} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {!assistantId ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#FFFFFF" />
          <Text style={styles.errorText}>Trusted KC Receptionist not configured</Text>
          <Text style={styles.errorSubtext}>Please configure a receptionist with a VAPI Assistant ID</Text>
        </View>
      ) : error && allCalls.length === 0 ? (
        <ErrorMessage error={error} onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={Object.keys(groupedCalls)}
          keyExtractor={(item) => item}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
          renderItem={({ item: monthKey }) => (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>{monthKey}</Text>
              {groupedCalls[monthKey].map((call) => {
                const customerNumber = getCustomerNumber(call)
                const duration = getDurationMinutes(call)
                const cost = call.cost || call.costBreakdown?.total || 0
                
                return (
                  <TouchableOpacity
                    key={call.id}
                    style={styles.callItem}
                    onPress={() => router.push(`/calls-test/${call.id}`)}
                  >
                    <MaterialCommunityIcons
                      name="phone"
                      size={24}
                      color="#FFFFFF"
                      style={styles.callIcon}
                    />
                    <View style={styles.callContent}>
                      <Text style={styles.callNumber}>{customerNumber}</Text>
                      <Text style={styles.callDate}>
                        {call.createdAt ? formatDate(call.createdAt) : 'Unknown date'}
                      </Text>
                      {call.status && (
                        <Text style={styles.callStatus}>{call.status}</Text>
                      )}
                    </View>
                    <View style={styles.callRight}>
                      <Text style={styles.callAmount}>{formatCurrency(cost)}</Text>
                      {duration > 0 && (
                        <Text style={styles.callMinutes}>{duration.toFixed(2)} min</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + 80 }
          ]}
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No calls found</Text>
              <Text style={styles.emptySubtext}>Using VAPI API directly</Text>
            </View>
          }
        />
      )}
      </LinearGradient>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Calls</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Month Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Month</Text>
                <View style={styles.monthGrid}>
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.monthButton,
                        selectedMonth === index && styles.monthButtonActive,
                      ]}
                      onPress={() => setSelectedMonth(selectedMonth === index ? null : index)}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          selectedMonth === index && styles.monthButtonTextActive,
                        ]}
                      >
                        {month.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
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
  clearButton: {
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
  },
  listContent: {
    paddingBottom: 0,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  callIcon: {
    marginRight: 12,
    color: '#FFFFFF',
  },
  callContent: {
    flex: 1,
  },
  callNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  callDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  callStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  callRight: {
    alignItems: 'flex-end',
  },
  callAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  callMinutes: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalScroll: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  monthButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  monthButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  monthButtonTextActive: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    marginTop: 100,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
})

