/**
 * Theme context provider
 */

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { colors, darkColors } from '@/constants/colors'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  colors: typeof colors
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light')

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const themeColors = theme === 'dark' ? darkColors : colors

  return (
    <ThemeContext.Provider value={{ theme, colors: themeColors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

