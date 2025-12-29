/**
 * Debug utility to check VAPI API key configuration
 * Use this to troubleshoot API key loading issues
 */

export const debugVapiConfig = () => {
  const privateKey = (process.env.EXPO_PUBLIC_VAPI_PRIVATE_KEY || '').trim()
  const publicKey = (process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY || '').trim()
  const legacyKey = (process.env.EXPO_PUBLIC_VAPI_API_KEY || '').trim()
  
  // Check window object too (for web)
  const windowPrivateKey = typeof window !== 'undefined' ? ((window as any).__ENV__?.EXPO_PUBLIC_VAPI_PRIVATE_KEY || '').trim() : ''
  const windowPublicKey = typeof window !== 'undefined' ? ((window as any).__ENV__?.EXPO_PUBLIC_VAPI_PUBLIC_KEY || '').trim() : ''
  const windowLegacyKey = typeof window !== 'undefined' ? ((window as any).__ENV__?.EXPO_PUBLIC_VAPI_API_KEY || '').trim() : ''
  
  const allEnvKeys = Object.keys(process.env).filter(k => k.includes('VAPI') || k.includes('EXPO_PUBLIC'))
  
  console.log('=== VAPI API Key Debug Info ===')
  console.log('Environment Variables:')
  console.log('  EXPO_PUBLIC_VAPI_PRIVATE_KEY exists:', !!process.env.EXPO_PUBLIC_VAPI_PRIVATE_KEY)
  console.log('  EXPO_PUBLIC_VAPI_PRIVATE_KEY length:', process.env.EXPO_PUBLIC_VAPI_PRIVATE_KEY?.length || 0)
  console.log('  EXPO_PUBLIC_VAPI_PUBLIC_KEY exists:', !!process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY)
  console.log('  EXPO_PUBLIC_VAPI_PUBLIC_KEY length:', process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY?.length || 0)
  console.log('  EXPO_PUBLIC_VAPI_API_KEY exists:', !!process.env.EXPO_PUBLIC_VAPI_API_KEY)
  console.log('  EXPO_PUBLIC_VAPI_API_KEY length:', process.env.EXPO_PUBLIC_VAPI_API_KEY?.length || 0)
  console.log('')
  console.log('Trimmed Keys:')
  console.log('  Private key length:', privateKey.length, privateKey.length > 0 ? `(${privateKey.substring(0, 10)}...)` : '(empty)')
  console.log('  Public key length:', publicKey.length, publicKey.length > 0 ? `(${publicKey.substring(0, 10)}...)` : '(empty)')
  console.log('  Legacy key length:', legacyKey.length, legacyKey.length > 0 ? `(${legacyKey.substring(0, 10)}...)` : '(empty)')
  console.log('')
  console.log('All EXPO_PUBLIC env vars:', allEnvKeys.join(', ') || '(none found)')
  console.log('=== End Debug Info ===')
  
  return {
    privateKeyExists: !!privateKey,
    publicKeyExists: !!publicKey,
    legacyKeyExists: !!legacyKey,
    privateKeyLength: privateKey.length,
    publicKeyLength: publicKey.length,
    legacyKeyLength: legacyKey.length,
    privateKeyFirstChars: privateKey.substring(0, 10) || '(empty)',
    publicKeyFirstChars: publicKey.substring(0, 10) || '(empty)',
    legacyKeyFirstChars: legacyKey.substring(0, 10) || '(empty)',
    allEnvVars: allEnvKeys,
  }
}

