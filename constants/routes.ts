/**
 * Route path constants
 */

export const ROUTES = {
  WELCOME: '/welcome',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  CALLS: '/calls',
  CALL_DETAIL: (id: string) => `/calls/${id}`,
  RECEPTIONIST: '/receptionist',
  ACCOUNT: '/account',
} as const

