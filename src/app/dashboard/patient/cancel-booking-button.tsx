'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    const reason = prompt('Please enter a reason for cancellation (optional):')
    if (reason === null) return // User clicked cancel on prompt

    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/patient-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to cancel booking')
        return
      }

      alert('Booking cancelled successfully')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('An error occurred while cancelling the booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCancel}
      disabled={loading}
      className="gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <XCircle className="h-4 w-4" />
      {loading ? 'Cancelling...' : 'Cancel Booking'}
    </Button>
  )
}
