'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n-provider'

type LocationType = 'HOME' | 'HOSPITAL'

export function BookingForm({
  caregiverId,
  caregiverName,
  patientOwnerId,
}: {
  caregiverId: string
  caregiverName: string
  patientOwnerId: string
}) {
  const router = useRouter()
  const [locationType, setLocationType] = useState<LocationType>('HOME')
  const [loading, setLoading] = useState(false)

  const [address, setAddress] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [wardNumber, setWardNumber] = useState('')
  const [bedNumber, setBedNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const { t: fullDict } = useI18n()
  const t = fullDict.bookingFlow || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (locationType === 'HOME' && !address.trim()) {
      toast.error(t.toastEnterAddress || 'Please enter the care address')
      return
    }
    if (locationType === 'HOSPITAL') {
      if (!hospitalName.trim()) {
        toast.error(t.toastEnterHospital || 'Please enter the hospital name')
        return
      }
      if (!wardNumber.trim() || !bedNumber.trim()) {
        toast.error(t.toastEnterWardBed || 'Please enter ward number and bed number')
        return
      }
    }
    if (!startDate || !endDate) {
      toast.error(t.toastDates || 'Please select start and end dates')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiverId,
          patientOwnerId,
          locationType,
          address: locationType === 'HOME' ? address : null,
          hospitalName: locationType === 'HOSPITAL' ? hospitalName : null,
          wardNumber: locationType === 'HOSPITAL' ? wardNumber : null,
          bedNumber: locationType === 'HOSPITAL' ? bedNumber : null,
          floor: locationType === 'HOSPITAL' ? floor || null : null,
          additionalInfo: locationType === 'HOSPITAL' ? additionalInfo || null : null,
          startDate,
          endDate,
          notes: notes || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to initialize checkout')
        return
      }

      if (data.url) {
        toast.loading(t.toastRedirecting || 'Redirecting to Stripe...')
        window.location.href = data.url
      } else {
        toast.error(t.toastError || 'Invalid checkout URL returned')
      }
    } catch {
      toast.error(t.toastError || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>{t.careLocation || 'Care location'}</Label>
            <div className="mt-2 flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="location"
                  value="HOME"
                  checked={locationType === 'HOME'}
                  onChange={() => setLocationType('HOME')}
                  className="text-primary-600"
                />
                {t.homeCare || 'Home care'}
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="location"
                  value="HOSPITAL"
                  checked={locationType === 'HOSPITAL'}
                  onChange={() => setLocationType('HOSPITAL')}
                  className="text-primary-600"
                />
                {t.hospital || 'Hospital'}
              </label>
            </div>
          </div>

          {locationType === 'HOME' && (
            <div>
              <Label htmlFor="address">{t.address || 'Address *'}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.addressPlaceholder || 'Full address for care'}
                required={locationType === 'HOME'}
              />
            </div>
          )}

          {locationType === 'HOSPITAL' && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div>
                <Label htmlFor="hospitalName">{t.hospitalName || 'Hospital name *'}</Label>
                <Input
                  id="hospitalName"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder={t.hospitalPlaceholder || 'e.g. City General Hospital'}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="wardNumber">{t.wardNumber || 'Ward number *'}</Label>
                  <Input
                    id="wardNumber"
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value)}
                    placeholder={t.wardPlaceholder || 'e.g. Ward 5A'}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bedNumber">{t.bedNumber || 'Bed number *'}</Label>
                  <Input
                    id="bedNumber"
                    value={bedNumber}
                    onChange={(e) => setBedNumber(e.target.value)}
                    placeholder={t.bedPlaceholder || 'e.g. 12'}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="floor">{t.floor || 'Floor (optional)'}</Label>
                <Input
                  id="floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder={t.floorPlaceholder || 'e.g. 3rd floor'}
                />
              </div>
              <div>
                <Label htmlFor="additionalInfo">{t.additionalInfo || 'Additional info (optional)'}</Label>
                <Input
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder={t.additionalInfoPlaceholder || 'Any other details'}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startDate">{t.startDate || 'Start date *'}</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">{t.endDate || 'End date *'}</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t.notes || 'Notes (optional)'}</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder={t.notesPlaceholder || 'Special instructions, patient condition, etc.'}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (t.processing || 'Processing...') : (t.proceedToPayment || 'Proceed to Payment (Stripe)')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
