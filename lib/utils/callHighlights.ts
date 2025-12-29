/**
 * Extract call highlights from transcript and metadata
 */

export interface CallHighlights {
  callerName?: string
  address?: string
  city?: string
  urgency?: 'High' | 'Medium' | 'Low'
  intent?: string
  keywords?: string[]
}

/**
 * Extract highlights from transcript text
 * Prioritizes summary/analysis as it's more accurate than raw transcript
 */
export function extractHighlights(transcript: string | null, summary?: string, excludeAssistantName?: string | null): CallHighlights {
  if (!transcript && !summary) {
    return {}
  }

  // Use summary first as it's more accurate, then fall back to transcript
  const primaryText = summary || transcript || ''
  const text = primaryText.toLowerCase()
  const highlights: CallHighlights = {
    keywords: [],
  }

  // Extract caller name - prioritize summary patterns first
  const excludeNames: string[] = ['grace', 'assistant', 'ai', 'bot', 'automated', 'system', 'vapi', 'receptionist', 'agent', 'trusted', 'kc', 'roofing', 'customer', 'caller', 'client', 'user']
  if (excludeAssistantName) {
    const assistantNameLower = excludeAssistantName.toLowerCase()
    excludeNames.push(assistantNameLower)
    if (assistantNameLower.includes(' ')) {
      excludeNames.push(...assistantNameLower.split(' '))
    }
  }
  
  // First, try to extract from summary (more reliable)
  if (summary) {
    // Summary often has structured patterns like "Customer [name]" or "[Name] called"
    const summaryNamePatterns = [
      /(?:customer|caller|client|contact)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:called|calling|contacted|reached out)/gi,
      /(?:call from|caller is|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    ]
    
    for (const pattern of summaryNamePatterns) {
      const matches = [...summary.matchAll(pattern)]
      for (const match of matches) {
        if (match && match[1]) {
          const extractedName = match[1].trim()
          const nameLower = extractedName.toLowerCase()
          if (extractedName.length > 2 && !excludeNames.includes(nameLower)) {
            highlights.callerName = extractedName
            break
          }
        }
      }
      if (highlights.callerName) break
    }
  }
  
  // If not found in summary, try transcript with better filtering
  if (!highlights.callerName && transcript) {
    // Get only user messages (exclude assistant/bot messages)
    const lines = transcript.split('\n')
    const userLines = lines.filter(line => {
      const lineLower = line.toLowerCase().trim()
      return !lineLower.startsWith('assistant:') && 
             !lineLower.startsWith('bot:') && 
             !lineLower.startsWith('grace:') &&
             (lineLower.startsWith('user:') || 
              lineLower.startsWith('customer:') || 
              lineLower.startsWith('caller:') ||
              !lineLower.includes(':'))
    }).join(' ')
    
    // Look for names in user messages only
    const namePatterns = [
      /(?:i'?m|this is|my name is|it'?s|call me|you can call me|name'?s)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /(?:^|\n)\s*(?:user|customer|caller|client)[:]\s*(?:i'?m|this is|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gim,
    ]
    
    for (const pattern of namePatterns) {
      const matches = [...userLines.matchAll(pattern)]
      // Use the FIRST match from user messages (most likely to be correct)
      for (const match of matches) {
        if (match && match[1]) {
          const extractedName = match[1].trim()
          const nameLower = extractedName.toLowerCase()
          if (extractedName.length > 2 && !excludeNames.includes(nameLower)) {
            highlights.callerName = extractedName
            break
          }
        }
      }
      if (highlights.callerName) break
    }
  }

  // Extract address - prioritize summary, it's more accurate
  const addressPatterns = [
    /\d+\s+[\w\s]+(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|blvd\.|court|ct|place|pl|parkway|pkwy|terrace|terr|circle|cir|trail|trl|highway|hwy|route|rt)/gi,
    /(?:address|located at|location|at)[:\s]+(\d+\s+[\w\s]+(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|terrace|terr|circle|cir|trail|trl))/gi,
    /(\d+\s+[\w\s]+(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|terrace|terr|circle|cir|trail|trl|highway|hwy))/gi,
  ]
  
  // Try summary first (more accurate)
  const searchText = summary || transcript || ''
  for (const pattern of addressPatterns) {
    const match = pattern.exec(searchText)
    if (match) {
      const address = match[1] || match[0]
      if (address) {
        highlights.address = address.trim().replace(/^address[:\s]+/i, '').trim()
        break
      }
    }
  }

  // Extract city - prioritize summary
  const cityPatterns = [
    // Specific cities (case-insensitive, whole word)
    /\b(kansas city|overland park|lee'?s summit|olathe|liberty|shawnee|brookside|independence|gladstone|raytown|kansas city mo|kansas city ks|kc mo|kc ks)\b/gi,
    // Generic city pattern with better context
    /(?:in|at|near|located in|city of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s|,|\.|$)/g,
  ]
  
  for (const pattern of cityPatterns) {
    const match = pattern.exec(searchText)
    if (match && match[1]) {
      const extractedCity = match[1].trim()
      // Filter out common false positives
      if (!['Grace', 'Assistant', 'Kansas', 'City'].includes(extractedCity) && extractedCity.length > 2) {
        highlights.city = extractedCity
        break
      }
    }
  }

  // Detect urgency keywords
  const highUrgencyKeywords = ['leak', 'leaking', 'emergency', 'urgent', 'asap', 'immediately', 'storm', 'damage', 'flood', 'water']
  const mediumUrgencyKeywords = ['soon', 'quickly', 'important', 'concerned', 'worried']
  
  const hasHighUrgency = highUrgencyKeywords.some(keyword => text.includes(keyword))
  const hasMediumUrgency = mediumUrgencyKeywords.some(keyword => text.includes(keyword))
  
  if (hasHighUrgency) {
    highlights.urgency = 'High'
    highlights.keywords?.push(...highUrgencyKeywords.filter(k => text.includes(k)))
  } else if (hasMediumUrgency) {
    highlights.urgency = 'Medium'
    highlights.keywords?.push(...mediumUrgencyKeywords.filter(k => text.includes(k)))
  } else {
    highlights.urgency = 'Low'
  }

  // Extract intent
  const intentKeywords = {
    'inspection': ['inspection', 'inspect', 'assess', 'look at', 'check'],
    'quote': ['quote', 'estimate', 'pricing', 'cost', 'price', 'how much'],
    'repair': ['repair', 'fix', 'replace', 'work needed'],
    'appointment': ['schedule', 'appointment', 'book', 'meeting', 'when'],
    'test': ['test', 'testing', 'just testing', 'demo'],
  }

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      highlights.intent = intent.charAt(0).toUpperCase() + intent.slice(1)
      break
    }
  }

  // Remove duplicates from keywords
  highlights.keywords = [...new Set(highlights.keywords)]

  return highlights
}

/**
 * Get smart call outcome label based on analysis and highlights
 */
export function getSmartCallOutcome(
  label: string,
  successEvaluation?: boolean | string,
  transcript?: string | null,
  summary?: string
): {
  type: 'lead' | 'test' | 'appointment' | 'missed' | 'other'
  label: string
  icon: string
} {
  const highlights = extractHighlights(transcript, summary)
  
  // Check for test calls first
  if (transcript?.toLowerCase().includes('test') || 
      transcript?.toLowerCase().includes('testing') ||
      summary?.toLowerCase().includes('test')) {
    return {
      type: 'test',
      label: 'Test Call',
      icon: 'test-tube',
    }
  }

  // Check for missed/hang-up (short duration + no success)
  // Note: We don't show spam label anymore, just mark as missed/other
  if (successEvaluation === false || successEvaluation === 'false') {
    return {
      type: 'missed',
      label: 'Missed / Hang-up',
      icon: 'phone-hangup',
    }
  }

  // Check for appointment
  if (highlights.intent === 'Appointment' || 
      transcript?.toLowerCase().includes('schedule') ||
      transcript?.toLowerCase().includes('appointment') ||
      summary?.toLowerCase().includes('schedule')) {
    return {
      type: 'appointment',
      label: 'Appointment Scheduled',
      icon: 'calendar-check',
    }
  }

  // Check for lead (default for successful calls that aren't test/appointment)
  if (label === 'lead' || successEvaluation === true || successEvaluation === 'true') {
    return {
      type: 'lead',
      label: 'Lead',
      icon: 'account-check',
    }
  }

  // Fallback to original label (spam is treated as 'other')
  const labelMap: Record<string, { type: any; label: string; icon: string }> = {
    lead: { type: 'lead', label: 'Lead', icon: 'account-check' },
    spam: { type: 'other', label: 'Other', icon: 'phone' }, // Map spam to other
    appointment: { type: 'appointment', label: 'Appointment', icon: 'calendar-check' },
    other: { type: 'other', label: 'Other', icon: 'phone' },
  }

  return labelMap[label] || { type: 'other', label: 'Other', icon: 'phone' }
}

/**
 * Extract client information from transcript and summary
 */
export interface ClientInfo {
  name?: string
  phone?: string
  email?: string
  location?: string
}

export function extractClientInfo(transcript: string | null, summary?: string, callerNumber?: string): ClientInfo {
  const info: ClientInfo = {}
  // Prioritize summary as it's more accurate
  const primaryText = summary || transcript || ''
  const text = primaryText.toLowerCase()
  
  // Extract phone number (if not already provided)
  if (callerNumber && callerNumber !== 'Unknown') {
    info.phone = callerNumber
  } else {
    // Try to extract phone from text (check both summary and transcript)
    const phonePatterns = [
      /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
      /\b(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
    ]
    for (const pattern of phonePatterns) {
      const match = pattern.exec(primaryText)
      if (match && match[1]) {
        info.phone = match[1]
        break
      }
    }
  }
  
  // Extract email
  const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g
  const emailMatch = emailPattern.exec(primaryText)
  if (emailMatch && emailMatch[1]) {
    info.email = emailMatch[1]
  }
  
  // Extract location (address, city) - prioritize summary
  const locationParts: string[] = []
  
  // Address pattern - improved to catch more variations including Terrace, directions like "Southeast", etc.
  const addressPatterns = [
    // Pattern for full address with direction: "1114 Southeast Second Terrace"
    /\d+\s+(?:North|South|East|West|Northeast|Northwest|Southeast|Southwest|N|S|E|W|NE|NW|SE|SW)\s+[\w\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Boulevard|Blvd|Terrace|Terr|Circle|Cir|Trail|Trl|Highway|Hwy|Route|Rt|Court|Ct|Place|Pl|Parkway|Pkwy)/gi,
    // Pattern for address without direction
    /\d+\s+[\w\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Boulevard|Blvd|Terrace|Terr|Circle|Cir|Trail|Trl|Highway|Hwy|Route|Rt|Court|Ct|Place|Pl|Parkway|Pkwy)/gi,
    // Pattern with context words
    /(?:address|located at|location|at|property at|property is at)\s*[:\s]*(\d+\s+(?:North|South|East|West|Northeast|Northwest|Southeast|Southwest)?\s*[\w\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Boulevard|Blvd|Terrace|Terr|Circle|Cir|Trail|Trl|Highway|Hwy|Route|Rt|Court|Ct|Place|Pl|Parkway|Pkwy))/gi,
  ]
  
  for (const pattern of addressPatterns) {
    const matches = [...primaryText.matchAll(pattern)]
    for (const match of matches) {
      const address = match[1] || match[0]
      if (address) {
        const cleanedAddress = address.trim().replace(/^address[:\s]+/i, '').replace(/^located at[:\s]+/i, '').replace(/^at[:\s]+/i, '').trim()
        // Verify it looks like an address (has number and street type)
        if (/\d/.test(cleanedAddress) && /(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Way|Boulevard|Blvd|Terrace|Terr|Circle|Cir|Trail|Trl|Highway|Hwy|Route|Rt|Court|Ct|Place|Pl|Parkway|Pkwy)/i.test(cleanedAddress)) {
          locationParts.push(cleanedAddress)
          break
        }
      }
    }
    if (locationParts.length > 0) break
  }
  
  // City pattern - improved with better context
  const cityPatterns = [
    // Specific cities (whole word matching)
    /\b(kansas city|overland park|lee'?s summit|olathe|liberty|shawnee|brookside|independence|gladstone|raytown|kansas city mo|kansas city ks|kc mo|kc ks)\b/gi,
    // Generic city pattern with better filtering
    /(?:in|at|near|located in|city of|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s|,|\.|$)/g,
  ]
  
  for (const pattern of cityPatterns) {
    const match = pattern.exec(primaryText)
    if (match) {
      const extractedCity = match[1] || match[0]
      if (extractedCity) {
        const city = extractedCity.trim()
        // Filter out common false positives
        if (!['Grace', 'Assistant', 'Kansas', 'City', 'Customer', 'Caller'].includes(city) && 
            city.length > 2 && 
            !city.toLowerCase().includes('assistant')) {
          locationParts.push(city)
          break
        }
      }
    }
  }
  
  if (locationParts.length > 0) {
    info.location = locationParts.join(', ')
  }
  
  // Extract client name - prioritize summary, then transcript
  const excludeNames = ['grace', 'assistant', 'ai', 'bot', 'automated', 'system', 'vapi', 'receptionist', 'agent', 'trusted', 'kc', 'roofing', 'customer', 'caller', 'client', 'user']
  
  // Try summary first (more reliable) - improved patterns
  if (summary) {
    const summaryNamePatterns = [
      // Patterns that catch "Carson Keating" style names in summaries
      /(?:customer|caller|client|contact|person)\s+(?:named\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:called|calling|contacted|reached out|spoke with)/gi,
      /(?:call from|caller is|name is|my name is|this is|caller'?s name is|the caller,?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      // Pattern for "Customer [Name] called" or "[Name] was the caller"
      /(?:customer|caller|client)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s|,|\.|$)/gi,
      // Pattern for "[Name] mentioned" or "[Name] provided"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:mentioned|provided|gave|requested)/gi,
      // Simple pattern: Capitalized word + Capitalized word (like "Carson Keating")
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
    ]
    
    // Collect all potential names first, then filter
    const potentialNames: string[] = []
    
    for (const pattern of summaryNamePatterns) {
      const matches = [...summary.matchAll(pattern)]
      for (const match of matches) {
        if (match && match[1]) {
          const extractedName = match[1].trim()
          if (extractedName.length > 3) {
            potentialNames.push(extractedName)
          }
        }
      }
    }
    
    // Filter and pick the best name (prefer 2-word names, exclude common words)
    for (const name of potentialNames) {
      const nameParts = name.split(/\s+/)
      const nameLower = name.toLowerCase()
      
      // Skip if it's in exclude list
      if (excludeNames.some(excluded => nameLower.includes(excluded))) {
        continue
      }
      
      // Prefer 2-word names (first and last name)
      if (nameParts.length >= 2) {
        // Check if both parts look like names (start with capital, reasonable length)
        if (nameParts.every(part => /^[A-Z][a-z]+$/.test(part) && part.length >= 2)) {
          info.name = name
          break
        }
      }
    }
    
    // If no 2-word name found, try single word names
    if (!info.name) {
      for (const name of potentialNames) {
        const nameLower = name.toLowerCase()
        if (!excludeNames.includes(nameLower) && name.length > 3 && /^[A-Z][a-z]+$/.test(name)) {
          info.name = name
          break
        }
      }
    }
  }
  
  // If not found in summary, try transcript
  if (!info.name && transcript) {
    // Get only user messages
    const lines = transcript.split('\n')
    const userLines = lines.filter(line => {
      const lineLower = line.toLowerCase().trim()
      return !lineLower.startsWith('assistant:') && 
             !lineLower.startsWith('bot:') && 
             !lineLower.startsWith('grace:')
    }).join(' ')
    
    const namePatterns = [
      /(?:i'?m|this is|my name is|it'?s|call me|you can call me|name'?s)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /(?:^|\n)\s*(?:user|customer|caller|client)[:]\s*(?:i'?m|this is|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gim,
    ]
    
    for (const pattern of namePatterns) {
      const match = pattern.exec(userLines)
      if (match && match[1]) {
        const extractedName = match[1].trim()
        if (extractedName.length > 2 && !excludeNames.includes(extractedName.toLowerCase())) {
          info.name = extractedName
          break
        }
      }
    }
  }
  
  return info
}

