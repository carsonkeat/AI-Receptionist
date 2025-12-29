/**
 * Navigation and routing types
 */

export type RootStackParamList = {
  index: undefined
  '(auth)': undefined
  '(tabs)': undefined
  'calls/[id]': { id: string }
}

export type AuthStackParamList = {
  welcome: undefined
  login: undefined
  signup: undefined
}

export type TabParamList = {
  dashboard: undefined
  calls: undefined
  receptionist: undefined
  account: undefined
}

