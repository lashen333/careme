'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Heart, LogOut, User, LayoutDashboard, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/language-switcher'

export function Navbar({ dict, currentLocale = 'en' }: { dict?: any, currentLocale?: string }) {
  const { data: session, status } = useSession()

  const t = dict || {
    findCaregivers: 'Find Caregivers',
    howItWorks: 'How It Works',
    dashboard: 'Dashboard',
    admin: 'Admin',
    signOut: 'Sign out',
    logIn: 'Log in',
    signUp: 'Sign up'
  }

  const navLinks = [
    { href: '/how-it-works', label: t.howItWorks },
  ]

  const showFindCaregivers = !session || session.user.role === 'PATIENT_OWNER'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary-600"
        >
          <Heart className="h-7 w-7 fill-primary-500 text-primary-500" />
          Careme
        </Link>

        <div className="flex items-center gap-6">
          {showFindCaregivers && (
            <Link
              href="/caregivers"
              className="text-sm font-medium text-slate-600 transition hover:text-primary-600"
            >
              {t.findCaregivers}
            </Link>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-primary-600"
            >
              {link.label}
            </Link>
          ))}

          {status === 'loading' ? (
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
          ) : session ? (
            <div className="flex items-center gap-2">
              <LanguageSwitcher currentLocale={currentLocale} />
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <Shield className="h-4 w-4" />
                  {t.admin}
                </Link>
              )}
              {(session.user.role === 'CAREGIVER' || session.user.role === 'PATIENT_OWNER') && (
                <Link
                  href={
                    session.user.role === 'CAREGIVER'
                      ? '/dashboard/caregiver'
                      : '/dashboard/patient'
                  }
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t.dashboard}
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <User className="h-4 w-4" />
                {session.user.name?.split(' ')[0]}
              </Link>
              <button
                onClick={() => signOut()}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
                  'text-slate-600 hover:bg-red-50 hover:text-red-600'
                )}
              >
                <LogOut className="h-4 w-4" />
                {t.signOut}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LanguageSwitcher currentLocale={currentLocale} />
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {t.logIn}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
              >
                {t.signUp}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

