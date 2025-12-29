/**
 * VAPI API client
 * Handles all interactions with VAPI Voice API
 */

const VAPI_API_URL = 'https://api.vapi.ai'
const VAPI_API_VERSION = '2024-11-19'

interface VapiConfig {
  apiKey: string
}

// Get keys from environment
const getVapiKeys = () => {
  // Check all possible sources for keys
  const privateKeyRaw =
    process.env.EXPO_PUBLIC_VAPI_PRIVATE_KEY ||
    process.env.EXPO_PUBLIC_VAPI_API_KEY || // Legacy: try as private key if no explicit private key
    (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_VAPI_PRIVATE_KEY) ||
    (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_VAPI_API_KEY) ||
    ''

  const publicKeyRaw =
    process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY ||
    (typeof window !== 'undefined' && (window as any).__ENV__?.EXPO_PUBLIC_VAPI_PUBLIC_KEY) ||
    ''

  const privateKey = privateKeyRaw.trim()
  const publicKey = publicKeyRaw.trim()

  // Enhanced debugging
  if (__DEV__) {
    console.log('[VAPI Keys Debug] ====================================')
    console.log('[VAPI Keys Debug] Raw environment check:')
    console.log('[VAPI Keys Debug] EXPO_PUBLIC_VAPI_PRIVATE_KEY exists:', !!process.env.EXPO_PUBLIC_VAPI_PRIVATE_KEY)
    console.log('[VAPI Keys Debug] EXPO_PUBLIC_VAPI_PUBLIC_KEY exists:', !!process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY)
    console.log('[VAPI Keys Debug] EXPO_PUBLIC_VAPI_API_KEY exists:', !!process.env.EXPO_PUBLIC_VAPI_API_KEY)
    console.log('[VAPI Keys Debug] Private key raw length:', privateKeyRaw.length)
    console.log('[VAPI Keys Debug] Public key raw length:', publicKeyRaw.length)
    console.log('[VAPI Keys Debug] Private key trimmed length:', privateKey.length)
    console.log('[VAPI Keys Debug] Public key trimmed length:', publicKey.length)
    console.log('[VAPI Keys Debug] Private key first 10 chars:', privateKey.substring(0, 10) || '(empty)')
    console.log('[VAPI Keys Debug] Public key first 10 chars:', publicKey.substring(0, 10) || '(empty)')
    console.log('[VAPI Keys Debug] All EXPO_PUBLIC env vars:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')).join(', '))
    console.log('[VAPI Keys Debug] ====================================')
  }

  return { privateKey, publicKey }
}

// Get VAPI API key from environment
// VAPI requires PUBLIC key for read operations (GET) and PRIVATE key for write operations (POST/PATCH/DELETE)
const getVapiConfig = (operation: 'read' | 'write' = 'read'): VapiConfig => {
  const { privateKey, publicKey } = getVapiKeys()

  let apiKey: string = ''
  let keyType: 'PUBLIC' | 'PRIVATE' | 'NONE' = 'NONE'

  // ALWAYS prefer private key for ALL operations (read and write)
  // The user's account allows private key for both operations, and public key doesn't work
  if (privateKey) {
    apiKey = privateKey
    keyType = 'PRIVATE'
    if (__DEV__) {
      console.log(`[VAPI Config] Using PRIVATE key for ${operation} operation.`)
    }
  } else if (publicKey) {
    // Fallback to public key only if private key is not available
    apiKey = publicKey
    keyType = 'PUBLIC'
    if (__DEV__) {
      console.warn(`[VAPI Config] Private key not found. Using PUBLIC key for ${operation} operation.`)
      console.warn('[VAPI Config] Make sure EXPO_PUBLIC_VAPI_PRIVATE_KEY is set in your .env file.')
    }
  }

  // Debug logging (remove in production)
  if (__DEV__) {
    console.log(`[VAPI Config] Operation: ${operation.toUpperCase()}`)
    console.log('[VAPI Config] Private key exists:', !!privateKey)
    console.log('[VAPI Config] Public key exists:', !!publicKey)
    console.log('[VAPI Config] Using key type:', keyType)
    console.log('[VAPI Config] API key length:', apiKey.length)
    console.log('[VAPI Config] API key starts with:', apiKey.substring(0, 10) + '...' || '(empty)')
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      `VAPI API key not found for ${operation} operations.\n\n` +
      `Please ensure the following is set in your .env file:\n` +
      '• EXPO_PUBLIC_VAPI_PRIVATE_KEY (RECOMMENDED - works for both read and write)\n' +
      '• EXPO_PUBLIC_VAPI_PUBLIC_KEY (fallback - read operations only)\n\n' +
      '⚠️ IMPORTANT: Variable names must start with EXPO_PUBLIC_ for Expo to read them!\n' +
      '   Correct: EXPO_PUBLIC_VAPI_PRIVATE_KEY=your-key-here\n' +
      '   Wrong:   EXPO_PRIVATE_VAPI_API_KEY=your-key-here\n\n' +
      'Get keys from: VAPI Dashboard → Settings → API Keys\n' +
      'After updating .env, restart Expo: npx expo start --clear'
    )
  }

  return { apiKey }
}

// Helper function to make authenticated VAPI requests
const vapiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  operation: 'read' | 'write' = 'read'
): Promise<T> => {
  const { privateKey, publicKey } = getVapiKeys()
  const config = getVapiConfig(operation)
  // Determine which key type we're actually using
  const actualKeyType = config.apiKey === privateKey ? 'PRIVATE' : config.apiKey === publicKey ? 'PUBLIC' : 'UNKNOWN'
  const url = `${VAPI_API_URL}/${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'VAPI-Version': VAPI_API_VERSION,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }))
    
    // Debug logging for error response
    if (__DEV__) {
      console.error('[VAPI API Error] Status:', response.status)
      console.error('[VAPI API Error] Response:', errorData)
      console.error('[VAPI API Error] Request URL:', url)
      console.error('[VAPI API Error] Operation:', operation)
      console.error('[VAPI API Error] API Key present:', !!config.apiKey)
      console.error('[VAPI API Error] API Key length:', config.apiKey?.length || 0)
    }
    
    // Handle specific error cases
    if (response.status === 401 || response.status === 403) {
      const errorMessage = errorData.message || errorData.error || errorData.detail || errorData.error?.message || 'Authentication failed'
      const lowerMessage = errorMessage.toLowerCase()
      
      // Get the actual error details from VAPI
      const actualError = errorData.error?.message || errorData.message || errorData.error || ''
      
      if (lowerMessage.includes('key') || lowerMessage.includes('invalid') || lowerMessage.includes('unauthorized') || actualError.includes('Invalid')) {
        // Check if the API key looks valid (VAPI keys typically start with specific prefixes)
        const apiKeyPrefix = config.apiKey?.substring(0, 10) || ''
        
        // Use the actual key type we determined
        const operationText = operation === 'read' ? 'reading' : 'updating'
        
        throw new Error(
          `Invalid VAPI API Key.\n\n` +
          `Error from VAPI: ${actualError || errorMessage}\n\n` +
          `Operation: ${operation.toUpperCase()} (using ${actualKeyType} key)\n\n` +
          `Troubleshooting steps:\n` +
          `• The code prioritizes EXPO_PUBLIC_VAPI_PRIVATE_KEY (works for both read and write)\n` +
          `• Current key length: ${config.apiKey?.length || 0} chars (detected: ${apiKeyPrefix})\n` +
          `• Private key loaded: ${privateKey ? 'YES' : 'NO'} (length: ${privateKey?.length || 0})\n` +
          `• Public key loaded: ${publicKey ? 'YES' : 'NO'} (length: ${publicKey?.length || 0})\n` +
          `• Check your .env file for EXPO_PUBLIC_VAPI_PRIVATE_KEY\n` +
          `• ⚠️ IMPORTANT: Variable names must start with EXPO_PUBLIC_ for Expo to read them!\n` +
          `• Get keys from: VAPI Dashboard → Settings → API Keys\n` +
          `• Check for spaces or quotes around the key value\n` +
          `• Restart Expo server: npx expo start --clear`
        )
      }
      throw new Error(`${errorMessage}\n\nPlease check your VAPI API key configuration.`)
    }
    
    if (response.status === 404) {
      throw new Error(errorData.message || 'Resource not found. The assistant may not exist or the ID is incorrect.')
    }
    
    throw new Error(errorData.message || errorData.error || `VAPI API error: ${response.status}`)
  }

  return response.json()
}

/**
 * VAPI Assistant Types
 */
export interface VapiAssistant {
  id: string
  orgId?: string
  createdAt?: string
  updatedAt?: string
  name?: string
  firstMessage?: string
  firstMessageInterruptionsEnabled?: boolean
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-waits-for-user' | 'assistant-speaks-first-with-model-generated-message'
  voicemailDetection?: string | object
  voicemailMessage?: string
  endCallMessage?: string
  endCallPhrases?: string[]
  maxDurationSeconds?: number // 10-43200, default 600
  backgroundSound?: string // 'off' | 'office' | 'coffee-shop' | 'outdoor' | string (custom URL)
  modelOutputInMessagesEnabled?: boolean
  clientMessages?: string
  serverMessages?: string
  model?: {
    provider: string
    model: string
    messages?: any[]
    temperature?: number
    maxTokens?: number
    tools?: any[]
    toolIds?: string[]
    [key: string]: any // Allow other model properties
  }
  voice?: {
    provider: string
    voiceId: string
    speed?: number // Speaking rate (0.5 to 2.0)
    pitch?: number // Pitch adjustment (-10 to +10)
    volumeGain?: number // Volume gain in dB (-10 to +10)
    stability?: number // Voice stability/expressiveness (0 to 1)
    similarityBoost?: number // For ElevenLabs
    cachingEnabled?: boolean
    [key: string]: any // Allow other voice properties
  }
  transcriber?: {
    provider: string
    language?: string
    [key: string]: any // Allow other transcriber properties
  }
  transportConfigurations?: any[]
  observabilityPlan?: any
  credentials?: any[]
  hooks?: any[]
  compliancePlan?: any
  metadata?: Record<string, any>
  backgroundSpeechDenoisingPlan?: any
  analysisPlan?: any
  artifactPlan?: any
  startSpeakingPlan?: any
  stopSpeakingPlan?: any
  monitorPlan?: any
  credentialIds?: string[]
  server?: any
  keypadInputPlan?: any
  pronunciationDictionary?: Array<{
    word: string
    phoneme: string
  }>
  fillerWords?: 'auto' | 'enable' | 'disable'
  phoneNumberId?: string
  serverUrl?: string
  serverUrlSecret?: string
  created?: string
  updated?: string
}

export interface VapiPhoneNumber {
  id: string
  number: string
  assistantId?: string
  name?: string
}

export interface VapiCall {
  id: string
  orgId?: string
  createdAt?: string
  updatedAt?: string
  type?: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall' | 'vapi.websocketCall'
  costs?: Array<{
    type: string
    provider: string
    minutes: number
    cost: number
  }>
  messages?: Array<{
    role: string
    message: string
    time: number
    endTime?: number
    secondsFromStart?: number
    duration?: number
    isFiltered?: boolean
    detectedThreats?: string[]
    originalMessage?: string
    metadata?: Record<string, unknown>
    speakerLabel?: string
  }>
  phoneCallTransport?: 'sip' | 'pstn'
  status?: 'scheduled' | 'queued' | 'ringing' | 'in-progress' | 'ended'
  endedReason?: string
  endedMessage?: string
  destination?: any
  startedAt?: string
  endedAt?: string
  cost?: number
  costBreakdown?: {
    transport?: number
    stt?: number
    llm?: number
    tts?: number
    vapi?: number
    chat?: number
    total?: number
    llmPromptTokens?: number
    llmCompletionTokens?: number
    llmCachedPromptTokens?: number
    ttsCharacters?: number
    analysisCostBreakdown?: {
      summary?: number
      summaryPromptTokens?: number
      summaryCompletionTokens?: number
      summaryCachedPromptTokens?: number
      structuredData?: number
      structuredDataPromptTokens?: number
      structuredDataCompletionTokens?: number
      structuredDataCachedPromptTokens?: number
      successEvaluation?: number
      successEvaluationPromptTokens?: number
      successEvaluationCompletionTokens?: number
      successEvaluationCachedPromptTokens?: number
      structuredOutput?: number
      structuredOutputPromptTokens?: number
      structuredOutputCompletionTokens?: number
      structuredOutputCachedPromptTokens?: number
    }
  }
  artifactPlan?: any
  analysis?: {
    summary?: string
    structuredData?: any
    structuredDataMulti?: any[]
    successEvaluation?: string
  }
  monitor?: {
    listenUrl?: string
    controlUrl?: string
  }
  artifact?: {
    messages?: any[]
    messagesOpenAIFormatted?: any[]
    recording?: {
      stereoUrl?: string
      videoUrl?: string
      videoRecordingStartDelaySeconds?: number
      mono?: {
        combinedUrl?: string
        assistantUrl?: string
        customerUrl?: string
      }
    }
    transcript?: string
    pcapUrl?: string
    logUrl?: string
    nodes?: any[]
    variableValues?: any
    performanceMetrics?: any
    structuredOutputs?: any
    scorecards?: any
    transfers?: string[]
    structuredOutputsLastUpdatedAt?: string
    recordingUrl?: string
    stereoRecordingUrl?: string
    videoRecordingUrl?: string
  }
  compliance?: any
  campaignId?: string
  assistantId?: string
  assistant?: any
  assistantOverrides?: any
  squadId?: string
  squad?: any
  squadOverrides?: any
  workflowId?: string
  workflow?: any
  workflowOverrides?: any
  phoneNumberId?: string
  phoneNumber?: any
  customerId?: string
  customer?: {
    number?: string
    numberE164CheckEnabled?: boolean
    extension?: string
    [key: string]: any
  }
  name?: string
  schedulePlan?: any
  transport?: any
  phoneCallProvider?: string
  phoneCallProviderId?: string
  
  // Legacy fields for backward compatibility
  recordingUrl?: string
  transcript?: string
  metadata?: Record<string, unknown>
}

/**
 * Create or update an assistant in VAPI
 */
export const createVapiAssistant = async (
  assistant: Partial<VapiAssistant>
): Promise<VapiAssistant> => {
  return vapiRequest<VapiAssistant>(
    'assistant',
    {
      method: 'POST',
      body: JSON.stringify(assistant),
    },
    'write'
  )
}

/**
 * Get an assistant by ID
 */
export const getVapiAssistant = async (assistantId: string): Promise<VapiAssistant> => {
  return vapiRequest<VapiAssistant>(`assistant/${assistantId}`, {}, 'read')
}

/**
 * Update an assistant
 */
export const updateVapiAssistant = async (
  assistantId: string,
  updates: Partial<VapiAssistant>
): Promise<VapiAssistant> => {
  return vapiRequest<VapiAssistant>(
    `assistant/${assistantId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    'write'
  )
}

/**
 * List all assistants
 */
export const listVapiAssistants = async (): Promise<VapiAssistant[]> => {
  const response = await vapiRequest<{ assistants: VapiAssistant[] }>('assistant', {}, 'read')
  return response.assistants || []
}

/**
 * Create a phone number
 */
export const createVapiPhoneNumber = async (
  phoneNumber: Partial<VapiPhoneNumber>
): Promise<VapiPhoneNumber> => {
  return vapiRequest<VapiPhoneNumber>(
    'phone-number',
    {
      method: 'POST',
      body: JSON.stringify(phoneNumber),
    },
    'write'
  )
}

/**
 * Get a phone number by ID
 */
export const getVapiPhoneNumber = async (phoneNumberId: string): Promise<VapiPhoneNumber> => {
  return vapiRequest<VapiPhoneNumber>(`phone-number/${phoneNumberId}`, {}, 'read')
}

/**
 * Update a phone number (assign to assistant)
 */
export const updateVapiPhoneNumber = async (
  phoneNumberId: string,
  updates: Partial<VapiPhoneNumber>
): Promise<VapiPhoneNumber> => {
  return vapiRequest<VapiPhoneNumber>(
    `phone-number/${phoneNumberId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    'write'
  )
}

/**
 * Get a call by ID
 */
export const getVapiCall = async (callId: string): Promise<VapiCall> => {
  return vapiRequest<VapiCall>(`call/${callId}`, {}, 'read')
}

/**
 * List calls with optional filters
 */
export const listVapiCalls = async (filters?: {
  id?: string
  assistantId?: string
  phoneNumberId?: string
  limit?: number
  createdAtGt?: string
  createdAtLt?: string
  createdAtGe?: string
  createdAtLe?: string
  updatedAtGt?: string
  updatedAtLt?: string
  updatedAtGe?: string
  updatedAtLe?: string
}): Promise<VapiCall[]> => {
  const queryParams = new URLSearchParams()
  if (filters?.id) queryParams.append('id', filters.id)
  if (filters?.assistantId) queryParams.append('assistantId', filters.assistantId)
  if (filters?.phoneNumberId) queryParams.append('phoneNumberId', filters.phoneNumberId)
  if (filters?.limit) queryParams.append('limit', filters.limit.toString())
  if (filters?.createdAtGt) queryParams.append('createdAtGt', filters.createdAtGt)
  if (filters?.createdAtLt) queryParams.append('createdAtLt', filters.createdAtLt)
  if (filters?.createdAtGe) queryParams.append('createdAtGe', filters.createdAtGe)
  if (filters?.createdAtLe) queryParams.append('createdAtLe', filters.createdAtLe)
  if (filters?.updatedAtGt) queryParams.append('updatedAtGt', filters.updatedAtGt)
  if (filters?.updatedAtLt) queryParams.append('updatedAtLt', filters.updatedAtLt)
  if (filters?.updatedAtGe) queryParams.append('updatedAtGe', filters.updatedAtGe)
  if (filters?.updatedAtLe) queryParams.append('updatedAtLe', filters.updatedAtLe)

  const endpoint = queryParams.toString() ? `call?${queryParams.toString()}` : 'call'
  // VAPI API returns array directly, not wrapped in object
  return vapiRequest<VapiCall[]>(endpoint, {}, 'read')
}

/**
 * Create a call (for outbound calls)
 */
export const createVapiCall = async (call: {
  assistantId: string
  customer?: {
    number: string
  }
  phoneNumberId?: string
  metadata?: Record<string, unknown>
}): Promise<VapiCall> => {
  return vapiRequest<VapiCall>(
    'call',
    {
      method: 'POST',
      body: JSON.stringify(call),
    },
    'write'
  )
}

/**
 * Webhook event types from VAPI
 */
export interface VapiWebhookEvent {
  type:
    | 'call-start'
    | 'call-end'
    | 'function-call'
    | 'status-update'
    | 'transcript'
    | 'hang'
    | 'recording'
    | 'model-output'
  call: VapiCall
  message?: string
  functionCall?: {
    name: string
    parameters: Record<string, unknown>
  }
}

