'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n-provider'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const { t: fullDict } = useI18n()
  const t = fullDict.auth || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!token) {
      toast.error('Invalid or missing reset token')
      return
    }

    if (password !== confirmPassword) {
      toast.error(t.passwordMismatch || 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || t.toastError || 'Something went wrong')
        return
      }
      setSuccess(true)
      toast.success(t.resetSuccess || 'Password reset successful')
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      toast.error(t.toastError || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-in zoom-in duration-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{t.resetSuccess || 'Password reset successful'}</h3>
        <p className="text-slate-500 mb-8">You can now log in with your new password. Redirecting you to the login page...</p>
        <Button asChild className="w-full">
          <Link href="/login">{t.logIn || 'Go to Login'}</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{t.newPassword || 'New Password'}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t.confirmPassword || 'Confirm Password'}</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={loading || !token}>
        {loading ? (t.sending || 'Resetting...') : (t.resetPassword || 'Reset Password')}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  const { t: fullDict } = useI18n()
  const t = fullDict.auth || {}

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-primary-100">
        <CardHeader className="space-y-1 text-center pb-8">
          <Link href="/" className="mx-auto flex items-center gap-2 text-primary-600 mb-2">
            <Heart className="h-8 w-8 fill-primary-500" />
            <span className="text-xl font-bold">Careme</span>
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t.resetPassword || 'Create New Password'}
          </CardTitle>
          <p className="text-sm text-slate-500">Please enter and confirm your new secure password.</p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center p-4">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
