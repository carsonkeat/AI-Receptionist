/**
 * Environment variable checking utility
 * Helps debug .env file loading issues
 */

export const checkEnvVars = () => {
  console.log('=== Environment Variables Check ===')
  console.log('All EXPO_PUBLIC variables:')
  
  const expoPublicVars = Object.keys(process.env)
    .filter(k => k.startsWith('EXPO_PUBLIC'))
    .sort()
  
  expoPublicVars.forEach(key => {
    const value = process.env[key] || ''
    const displayValue = value.length > 0 
      ? `${value.substring(0, 15)}... (${value.length} chars)`
      : '(empty)'
    console.log(`  ${key}: ${displayValue}`)
  })
  
  console.log('=== End Check ===')
  
  return {
    vapiPrivateKey: process.env.EXPO_PUBLIC_VAPI_PRIVATE_KEY || '',
    vapiPublicKey: process.env.EXPO_PUBLIC_VAPI_PUBLIC_KEY || '',
    vapiApiKey: process.env.EXPO_PUBLIC_VAPI_API_KEY || '',
    allExpoPublicKeys: expoPublicVars,
  }
}

