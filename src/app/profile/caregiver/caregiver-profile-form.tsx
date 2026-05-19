'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { CaregiverProfile, Experience, Certificate } from '@/db/schema'
import { useI18n } from '@/components/i18n-provider'
import { Camera, Loader2, User as UserIcon } from 'lucide-react'

type ProfileWithStatus = CaregiverProfile & { status: string }

export function CaregiverProfileForm({
  profile,
  experiences,
  certificates,
  user,
}: {
  profile: ProfileWithStatus
  experiences: Experience[]
  certificates: Certificate[]
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

  const [bio, setBio] = useState(profile.bio || '')
  const [experienceYears, setExperienceYears] = useState(profile.experienceYears.toString())
  const [hourlyRate, setHourlyRate] = useState(profile.hourlyRate.toString())
  const [specializations, setSpecializations] = useState(profile.specializations || '')
  const [kycDocumentUrl, setKycDocumentUrl] = useState(profile.kycDocumentUrl || '')

  const [expTitle, setExpTitle] = useState('')
  const [expOrg, setExpOrg] = useState('')
  const [expDesc, setExpDesc] = useState('')
  const [expStart, setExpStart] = useState('')
  const [expEnd, setExpEnd] = useState('')
  const [expCurrent, setExpCurrent] = useState(false)

  const [certName, setCertName] = useState('')
  const [certIssuer, setCertIssuer] = useState('')
  const [certDocUrl, setCertDocUrl] = useState('')

  const { t: fullDict } = useI18n()
  const t = fullDict.profileForm || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/profile/caregiver', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          experienceYears: parseInt(experienceYears) || 0,
          hourlyRate: parseFloat(hourlyRate) || 0,
          specializations: specializations.split(',').map((s) => s.trim()).filter(Boolean).join(', '),
          kycDocumentUrl: kycDocumentUrl || null,
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

  async function handlePublish() {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/caregiver/publish', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t.toastPublishFailed || 'Failed to publish profile')
        return
      }
      toast.success(t.toastPublished || 'Profile published! You are now live.')
      router.refresh()
    } catch {
      toast.error(t.toastError || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function addExperience(e: React.FormEvent) {
    e.preventDefault()
    if (!expTitle || !expStart) return
    setLoading(true)
    try {
      await fetch('/api/profile/caregiver/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: expTitle,
          organization: expOrg || null,
          description: expDesc || null,
          startDate: expStart,
          endDate: expCurrent ? null : expEnd || null,
          current: expCurrent,
        }),
      })
      setExpTitle('')
      setExpOrg('')
      setExpDesc('')
      setExpStart('')
      setExpEnd('')
      setExpCurrent(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function addCertificate(e: React.FormEvent) {
    e.preventDefault()
    if (!certName || !certDocUrl) return
    setLoading(true)
    try {
      await fetch('/api/profile/caregiver/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: certName,
          issuer: certIssuer || null,
          documentUrl: certDocUrl,
        }),
      })
      setCertName('')
      setCertIssuer('')
      setCertDocUrl('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const isApproved = profile.status === 'APPROVED'
  const isPendingReview = profile.status === 'PENDING_REVIEW'
  const isSuspended = profile.status === 'SUSPENDED'

  return (
    <div className="mt-8 space-y-8">
      <Card>
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
                      disabled={isSuspended || uploadingAvatar}
                    />
                  </label>
                )}
              </div>
              <div className="text-center sm:text-left mt-3 sm:mt-0">
                <h4 className="text-sm font-semibold text-slate-900">{t.profilePicture || 'Profile Picture'}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {t.avatarHelpText || 'Clear profile pictures help build trust with patient owners. Supports JPG, PNG, and WebP.'}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="bio">{t.bio || 'Bio'}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 min-h-[100px]"
                placeholder={t.bioPlaceholder || 'Tell patients about yourself and your caregiving approach...'}
                disabled={isSuspended}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="expYears">{t.yearsOfExperience || 'Years of experience'}</Label>
                <Input
                  id="expYears"
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  disabled={isSuspended}
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">{t.hourlyRate || 'Hourly rate (USD)'}</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  disabled={isSuspended}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="specializations">{t.specializations || 'Specializations (comma-separated)'}</Label>
              <Input
                id="specializations"
                value={specializations}
                onChange={(e) => setSpecializations(e.target.value)}
                placeholder={t.specializationsPlaceholder || 'e.g. elderly care, disability, post-surgery'}
                disabled={isSuspended}
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <Button type="submit" variant="outline" disabled={loading || isSuspended}>
                {loading ? (t.saving || 'Saving...') : (t.saveDraft || 'Save Profile')}
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={loading || isApproved || isPendingReview || isSuspended}
                variant={(isApproved || isPendingReview) ? "secondary" : "default"}
              >
                {isApproved 
                  ? (t.alreadyPublished || 'Published & Live') 
                  : isPendingReview 
                    ? (t.underReview || 'Under Review') 
                    : (t.publishProfile || 'Submit for Review')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">{t.addExperience || 'Add experience'}</h3>
          <form onSubmit={addExperience} className="mt-4 space-y-3">
            <Input
              placeholder={t.title || 'Title'}
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              required
            />
            <Input
              placeholder={t.organization || 'Organization'}
              value={expOrg}
              onChange={(e) => setExpOrg(e.target.value)}
            />
            <Textarea
              placeholder={t.description || 'Description'}
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="space-y-1">
                <Label htmlFor="expStart" className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Start Date</Label>
                <Input
                  id="expStart"
                  type="date"
                  value={expStart}
                  onChange={(e) => setExpStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expEnd" className="text-[10px] uppercase font-bold tracking-wider text-slate-400">End Date</Label>
                <Input
                  id="expEnd"
                  type="date"
                  value={expEnd}
                  onChange={(e) => setExpEnd(e.target.value)}
                  disabled={expCurrent}
                />
              </div>
              <div className="flex items-center h-full sm:pt-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={expCurrent}
                    onChange={(e) => setExpCurrent(e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                  />
                  {t.current || 'Current'}
                </label>
              </div>
            </div>
            <Button type="submit" size="sm" disabled={loading}>
              {t.addExperience || 'Add experience'}
            </Button>
          </form>
          {experiences.length > 0 && (
            <ul className="mt-4 space-y-2">
              {experiences.map((e) => (
                <li key={e.id} className="text-sm text-slate-600">
                  {e.title} {e.organization && `at ${e.organization}`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">{t.addCertificate || 'Add certificate'}</h3>
          <form onSubmit={addCertificate} className="mt-4 space-y-3">
            <Input
              placeholder={t.certificateName || 'Certificate name'}
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              required
            />
            <Input
              placeholder={t.issuer || 'Issuer'}
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
            />
            <Input
              type="url"
              placeholder={t.documentUrl || 'Document URL'}
              value={certDocUrl}
              onChange={(e) => setCertDocUrl(e.target.value)}
              required
            />
            <Button type="submit" size="sm" disabled={loading}>
              {t.addCertificate || 'Add certificate'}
            </Button>
          </form>
          {certificates.length > 0 && (
            <ul className="mt-4 space-y-2">
              {certificates.map((c) => (
                <li key={c.id} className="text-sm text-slate-600">{c.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
