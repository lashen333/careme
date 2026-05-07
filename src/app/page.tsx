import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Heart, Shield, Calendar, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

export default async function HomePage() {
  const session = await getSession()
  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const dict = await getDictionary(locale)
  const t = dict.home || {}

  if (session?.user) {
    if (session.user.role === 'CAREGIVER') {
      redirect('/dashboard/caregiver')
    } else if (session.user.role === 'PATIENT_OWNER') {
      redirect('/caregivers')
    } else if (session.user.role === 'ADMIN') {
      redirect('/admin')
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(217,70,239,0.08),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              {t.heroTitle1 || 'Find Trusted Caregivers'}
              <span className="block text-primary-600">{t.heroTitle2 || 'For Your Loved Ones'}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              {t.heroDesc || 'Careme connects patient owners with verified, experienced caregivers. Book home or hospital care with certified professionals. Your peace of mind starts here.'}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/caregivers">
                  <Heart className="h-5 w-5" />
                  {t.browseCaregivers || 'Browse Caregivers'}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/how-it-works">{t.howItWorks || 'How It Works'}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              {t.whyChoose || 'Why Choose Careme?'}
            </h2>
            <p className="mt-4 text-slate-600">
              {t.industryLeading || 'Industry-leading standards for caregiver matching'}
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: t.feat1Title || 'Verified & KYC Checked',
                desc: t.feat1Desc || 'All caregivers undergo identity verification and background checks.',
              },
              {
                icon: UserCheck,
                title: t.feat2Title || 'Experienced Professionals',
                desc: t.feat2Desc || 'View profiles with experience, qualifications, and certificates.',
              },
              {
                icon: Calendar,
                title: t.feat3Title || 'Flexible Booking',
                desc: t.feat3Desc || 'Book for home care or hospital with ward and bed details.',
              },
              {
                icon: Heart,
                title: t.feat4Title || 'Trusted Platform',
                desc: t.feat4Desc || 'Accept or cancel bookings with full transparency.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 transition hover:border-primary-200 hover:shadow-md"
              >
                <item.icon className="h-10 w-10 text-primary-600" />
                <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t.ctaTitle || 'Ready to Get Started?'}
          </h2>
          <p className="mt-4 text-primary-100">
            {t.ctaDesc || 'Join as a patient owner to book care, or as a caregiver to offer your services.'}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-primary-600 hover:bg-primary-50"
            >
              {t.signUp || 'Sign Up'}
            </Link>
            <Link
              href="/login"
              className="rounded-lg border-2 border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              {t.logIn || 'Log In'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
