'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n-provider'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { t: fullDict } = useI18n()
  const t = fullDict.auth || {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        toast.error(t.toastInvalidCredentials || 'Invalid email or password')
        return
      }
      toast.success(t.toastSignInSuccess || 'Signed in successfully!')
      router.push(callbackUrl)
      router.refresh()
    } catch {
      toast.error(t.toastError || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t.email || 'Email'}</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.password || 'Password'}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (t.signingIn || 'Signing in...') : (t.signIn || 'Sign in')}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        {t.noAccount || "Don't have an account?"}{' '}
        <Link href="/register" className="font-medium text-primary-600 hover:underline">
          {t.signUp || 'Sign up'}
        </Link>
      </p>
    </CardContent>
  )
}

export default function LoginPage() {
  const { t: fullDict } = useI18n()
  const t = fullDict.auth || {}
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="mx-auto flex items-center gap-2 text-primary-600">
            <Heart className="h-8 w-8 fill-primary-500" />
            <span className="text-xl font-bold">Careme</span>
          </Link>
          <CardTitle className="text-2xl">{t.welcomeBack || 'Welcome back'}</CardTitle>
          <p className="text-sm text-slate-500">{t.signInToAcc || 'Sign in to your account'}</p>
        </CardHeader>
        <Suspense fallback={<CardContent><div className="flex justify-center p-4">Loading...</div></CardContent>}>
          <LoginForm />
        </Suspense>
      </Card>
    </div>
  )
}
