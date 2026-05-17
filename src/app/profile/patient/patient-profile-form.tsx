'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { PatientProfile } from '@/db/schema'
import { useI18n } from '@/components/i18n-provider'
import { Camera, Loader2, User as UserIcon } from 'lucide-react'

export function PatientProfileForm({
  profile,
  user,
}: {
  profile: PatientProfile
  user: { avatar: string | null; name: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState(user.avatar)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to upload image')
        return
      }

      setAvatarUrl(data.avatarUrl)
      toast.success('Profile picture updated successfully')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload image')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const [address, setAddress] = useState(profile.address || '')
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact || '')
  const [patientNotes, setPatientNotes] = useState(profile.patientNotes || '')

  const { t: fullDict } = useI18n()
  const t = fullDict.profileForm || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/profile/patient', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          emergencyContact,
          patientNotes,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || t.toastUpdateFailed || 'Update failed')
        return
      }
      toast.success(t.toastSaved || 'Profile saved successfully')
      router.refresh()
    } catch {
      toast.error(t.toastError || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Premium Avatar Edit Section */}
            <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100 sm:flex-row sm:justify-start sm:gap-6">
              <div className="relative group">
                <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-primary-50/50 bg-slate-100 flex items-center justify-center text-slate-400">
                  {uploadingAvatar ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                {!uploadingAvatar && (
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-primary-700 transition-transform duration-200 hover:scale-110 flex items-center justify-center border border-white"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
              </div>
              <div className="text-center sm:text-left mt-3 sm:mt-0">
                <h4 className="text-sm font-semibold text-slate-900">{t.profilePicture || 'Profile Picture'}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {t.avatarHelpText || 'Clear profile pictures help build trust with caregivers. Supports JPG, PNG, and WebP.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 font-semibold">{t.address || 'Default Home Address'}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
                placeholder="Enter your home address for care visits"
                className="rounded-lg border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact" className="text-slate-700 font-semibold">{t.emergencyContact || 'Emergency Contact'}</Label>
              <Input
                id="emergencyContact"
                value={emergencyContact}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmergencyContact(e.target.value)}
                placeholder="Name and Phone Number"
                className="rounded-lg border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientNotes" className="text-slate-700 font-semibold">{t.patientNotes || 'Medical / Care Notes'}</Label>
              <Textarea
                id="patientNotes"
                value={patientNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPatientNotes(e.target.value)}
                className="mt-1 min-h-[120px] rounded-lg border-slate-200 resize-none"
                placeholder="List any medical conditions, allergies, or special care requirements..."
              />
              <p className="text-xs text-slate-500">
                These notes will be shared with caregivers when you book them.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button type="submit" className="w-full sm:w-auto px-8" disabled={loading}>
                {loading ? (t.saving || 'Saving...') : (t.saveProfile || 'Save Profile')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
