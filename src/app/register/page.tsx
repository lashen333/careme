'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n-provider'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'CAREGIVER' | 'PATIENT_OWNER'>('PATIENT_OWNER')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { t: fullDict } = useI18n()
  const t = fullDict.auth || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      if (phone) formData.append('phone', phone)
      formData.append('password', password)
      formData.append('role', role)
      if (avatar) formData.append('avatar', avatar)

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || t.toastError || 'Registration failed')
        return
      }
      toast.success(t.toastRegisterSuccess || 'Registration successful. Please log in.')
      router.push('/login?registered=1')
      router.refresh()
    } catch {
      toast.error(t.toastError || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="mx-auto flex items-center gap-2 text-primary-600">
            <Heart className="h-8 w-8 fill-primary-500" />
            <span className="text-xl font-bold">Careme</span>
          </Link>
          <CardTitle className="text-2xl">{t.createAcc || 'Create an account'}</CardTitle>
          <p className="text-sm text-slate-500">{t.joinAs || 'Join Careme as a caregiver or patient owner'}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.iAm || 'I am a'}</Label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="PATIENT_OWNER"
                    checked={role === 'PATIENT_OWNER'}
                    onChange={() => setRole('PATIENT_OWNER')}
                    className="text-primary-600"
                  />
                  {t.patientOwner || 'Patient Owner'}
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="CAREGIVER"
                    checked={role === 'CAREGIVER'}
                    onChange={() => setRole('CAREGIVER')}
                    className="text-primary-600"
                  />
                  {t.caregiver || 'Caregiver'}
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t.fullName || 'Full name'}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email || 'Email'}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phoneOpt || 'Phone (optional)'}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.passwordMin || 'Password (min 8 characters)'}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">{t.profileImage || 'Profile Image (optional)'}</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAvatar(e.target.files[0])
                  }
                }}
              />
              {avatar && (
                <div className="mt-2 text-sm text-slate-500">
                  Selected: {avatar.name}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (t.creatingAcc || 'Creating account...') : (t.signUp || 'Sign up')}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {t.alreadyHaveAcc || 'Already have an account?'}{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              {t.logIn || 'Log in'}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
