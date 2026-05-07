'use client'

import { Navigation, MapPin, PlayCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'

export function LiveTracker({ status }: { status: string }) {
  const { t: fullDict } = useI18n()
  const t = fullDict.liveTracker || {}
  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold">
        <Clock className="w-4 h-4" /> {t.pending || 'Waiting for Caregiver'}
      </div>
    )
  }

  if (status === 'CONFIRMED') {
    return (
      <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-xs font-semibold">
        <CheckCircle className="w-4 h-4" /> {t.confirmed || 'Confirmed'}
      </div>
    )
  }

  if (status === 'EN_ROUTE') {
    return (
      <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
        <Navigation className="w-4 h-4" /> {t.caregiverEnRoute || 'Caregiver En Route'}
      </div>
    )
  }

  if (status === 'ARRIVED') {
    return (
      <div className="flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full text-xs font-semibold">
        <MapPin className="w-4 h-4" /> {t.caregiverArrived || 'Caregiver Arrived'}
      </div>
    )
  }

  if (status === 'IN_PROGRESS') {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
        <PlayCircle className="w-4 h-4" /> {t.serviceInProgress || 'Service In Progress'}
      </div>
    )
  }

  if (status === 'COMPLETED') {
    return (
      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold">
        <CheckCircle className="w-4 h-4" /> {t.completed || 'Completed'}
      </div>
    )
  }

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-semibold">
        <XCircle className="w-4 h-4" /> {t.cancelled || 'Cancelled'}
      </div>
    )
  }

  return null
}
