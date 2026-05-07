'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import type { CaregiverProfile, Experience, Certificate } from '@/db/schema'
import { useI18n } from '@/components/i18n-provider'

type ProfileWithStatus = CaregiverProfile & { status: string }

export function CaregiverProfileForm({
  profile,
  experiences,
  certificates,
}: {
  profile: ProfileWithStatus
  experiences: Experience[]
  certificates: Certificate[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="mt-8 space-y-8">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="bio">{t.bio || 'Bio'}</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 flex min-h-[100px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder={t.bioPlaceholder || 'Tell patients about yourself and your caregiving approach...'}
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
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <Button type="submit" variant="outline" disabled={loading}>
                {loading ? (t.saving || 'Saving...') : (t.saveDraft || 'Save Draft')}
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={loading || isApproved}
                variant={isApproved ? "secondary" : "default"}
              >
                {isApproved ? (t.alreadyPublished || 'Already Published') : (t.publishProfile || 'Publish Profile')}
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
            <textarea
              placeholder={t.description || 'Description'}
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              className="flex min-h-[60px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={expStart}
                onChange={(e) => setExpStart(e.target.value)}
                required
              />
              <Input
                type="date"
                value={expEnd}
                onChange={(e) => setExpEnd(e.target.value)}
                disabled={expCurrent}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={expCurrent}
                  onChange={(e) => setExpCurrent(e.target.checked)}
                />
                {t.current || 'Current'}
              </label>
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
