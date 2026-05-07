'use client'

import React, { createContext, useContext } from 'react'

const I18nContext = createContext<any>(null)

export function I18nProvider({ children, dict }: { children: React.ReactNode, dict: any }) {
  return <I18nContext.Provider value={{ t: dict }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) return { t: {} }
  return context
}
