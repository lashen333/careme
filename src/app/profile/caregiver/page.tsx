import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { caregiverProfiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { CaregiverProfileForm } from './caregiver-profile-form'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

export default async function CaregiverProfilePage() {
  const { authorized, session } = await requireAuth(['CAREGIVER'])
  if (!authorized || !session?.user) redirect('/login')

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.profile || {}

  const profile = await db.query.caregiverProfiles.findFirst({
    where: eq(caregiverProfiles.userId, session.user.id),
    with: {
      experiences: true,
      certificates: true,
    },
  })

  if (!profile) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    })
    if (!user || user.role !== 'CAREGIVER') redirect('/')
    
    const [newProfile] = await db.insert(caregiverProfiles).values({
      userId: user.id,
    }).returning()
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-amber-800">
            {t.profileStatus ? t.profileStatus.replace('{status}', t.statusPending || 'PENDING') : 'Profile Status: PENDING'}
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            {t.welcomePending || 'Welcome to Careme! Complete your profile below and click "Publish Profile" to become visible to patients.'}
          </p>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t.setupProfileTitle || 'Set up your profile'}</h1>
          <p className="mt-2 text-slate-600">
            {t.setupProfileDesc || 'A complete profile helps you get booked faster. Add your basic details, experience, and certificates.'}
          </p>
        </div>
        <CaregiverProfileForm profile={newProfile as any} experiences={[]} certificates={[]} />
      </div>
    )
  }

  const isApproved = profile.status === 'APPROVED'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {isApproved ? (
        <div className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-800">
              {t.profileStatus ? t.profileStatus.replace('{status}', t.statusLive || 'LIVE') : 'Profile Status: LIVE'}
            </h2>
            <p className="text-sm text-emerald-700">
              {t.liveDesc || 'Your profile is visible to patient owners. You can continue scanning for bookings!'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-800">
              {t.profileStatus ? t.profileStatus.replace('{status}', t.statusPending || 'PENDING') : 'Profile Status: PENDING'}
            </h2>
            <p className="text-sm text-amber-700">
              {t.hiddenDesc || 'Your profile is hidden. You must add a bio and hourly rate, then click "Publish Profile" at the bottom to go live.'}
            </p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t.editPublicTitle || 'Edit caregiver profile'}</h1>
        <p className="mt-2 text-slate-600">
          {t.editPublicDesc || 'Make updates to your public caregiver listing and adjust your hourly rate or specializations.'}
        </p>
      </div>

      <CaregiverProfileForm
        profile={profile}
        experiences={profile.experiences}
        certificates={profile.certificates}
      />
    </div>
  )
}

