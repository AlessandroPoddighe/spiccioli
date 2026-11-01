import { createContext, use } from 'react'
import type { AppConfig } from './env'

export const ConfigContext = createContext<AppConfig | null>(null)

export function useConfig(): AppConfig {
  const value = use(ConfigContext)
  if (!value) throw new Error('useConfig deve essere usato dentro <ConfigContext>')
  return value
}
