'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n-provider'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const { t: fullDict } = useI18n()
  const t = fullDict.auth || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || t.toastError || 'Something went wrong')
        return
      }
      setSubmitted(true)
      toast.success(t.checkEmail || 'Check your email for a reset link')
    } catch {
      toast.error(t.toastError || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-primary-100">
        <CardHeader className="space-y-1 text-center pb-8">
          <Link href="/" className="mx-auto flex items-center gap-2 text-primary-600 mb-2">
            <Heart className="h-8 w-8 fill-primary-500" />
            <span className="text-xl font-bold">Careme</span>
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t.resetPassword || 'Reset Password'}
          </CardTitle>
          <p className="text-sm text-slate-500">
            {submitted ? t.checkEmail : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">{t.email || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border-slate-200 focus:ring-primary-500"
                  required
                />
              </div>
              <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={loading}>
                {loading ? (t.sending || 'Sending...') : (t.sendResetLink || 'Send Reset Link')}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-100 mb-6 text-sm">
                If an account exists with this email, a reset link has been sent. Please check your inbox and spam folder.
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.logIn || 'Back to login'}
                </Link>
              </Button>
            </div>
          )}
          
          {!submitted && (
            <div className="mt-8 text-center">
              <Link href="/login" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.logIn || 'Back to login'}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
