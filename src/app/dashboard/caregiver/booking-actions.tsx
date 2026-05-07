'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X, MapPin, Navigation, PlayCircle, CheckCircle } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'

export function BookingActions({ bookingId, initialStatus }: { bookingId: string; initialStatus: string }) {
  const router = useRouter()
  const { t: fullDict } = useI18n()
  const t = fullDict.bookingActions || {}
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStatusUpdate(status: string) {
    setLoading(status)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  // Temporary function for backward compatibility with existing Accept/Decline routes
  async function handleAccept() {
    setLoading('accept')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel() {
    setLoading('cancel')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Declined by caregiver' }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(null)
    }
  }

  if (initialStatus === 'PENDING') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAccept} disabled={!!loading} className="gap-1">
          <Check className="h-4 w-4" />
          {loading === 'accept' ? (t.accepting || 'Accepting...') : (t.accept || 'Accept')}
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} disabled={!!loading} className="gap-1">
          <X className="h-4 w-4" />
          {loading === 'cancel' ? (t.declining || 'Declining...') : (t.decline || 'Decline')}
        </Button>
      </div>
    )
  }

  if (initialStatus === 'CONFIRMED') {
    return (
      <Button size="sm" onClick={() => handleStatusUpdate('EN_ROUTE')} disabled={!!loading} className="w-full sm:w-auto gap-1 bg-amber-500 hover:bg-amber-600 text-white">
        <Navigation className="h-4 w-4" />
        {loading === 'EN_ROUTE' ? (t.updating || 'Updating...') : (t.startTrip || 'Start Trip / En Route')}
      </Button>
    )
  }

  if (initialStatus === 'EN_ROUTE') {
    return (
      <Button size="sm" onClick={() => handleStatusUpdate('ARRIVED')} disabled={!!loading} className="w-full sm:w-auto gap-1 bg-blue-500 hover:bg-blue-600 text-white">
        <MapPin className="h-4 w-4" />
        {loading === 'ARRIVED' ? (t.updating || 'Updating...') : (t.iHaveArrived || 'I Have Arrived')}
      </Button>
    )
  }

  if (initialStatus === 'ARRIVED') {
    return (
      <Button size="sm" onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={!!loading} className="w-full sm:w-auto gap-1 bg-indigo-500 hover:bg-indigo-600 text-white">
        <PlayCircle className="h-4 w-4" />
        {loading === 'IN_PROGRESS' ? (t.updating || 'Updating...') : (t.startCare || 'Start Care Service')}
      </Button>
    )
  }

  if (initialStatus === 'IN_PROGRESS') {
    return (
      <Button size="sm" onClick={() => handleStatusUpdate('COMPLETED')} disabled={!!loading} className="w-full sm:w-auto gap-1 bg-emerald-500 hover:bg-emerald-600 text-white">
        <CheckCircle className="h-4 w-4" />
        {loading === 'COMPLETED' ? (t.updating || 'Updating...') : (t.completeCare || 'Complete Care')}
      </Button>
    )
  }

  return null
}
