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
      user: true,
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
        <CaregiverProfileForm profile={newProfile as any} experiences={[]} certificates={[]} user={user} />
      </div>
    )
  }

  const isApproved = profile.status === 'APPROVED'
  const isPendingReview = profile.status === 'PENDING_REVIEW'
  const isRejected = profile.status === 'REJECTED'
  const isSuspended = profile.status === 'SUSPENDED'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {isApproved && (
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
              {t.liveDesc || 'Your profile is visible to patient owners. You can continue receiving bookings!'}
            </p>
          </div>
        </div>
      )}

      {isPendingReview && (
        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-blue-800">
              {t.profileStatus ? t.profileStatus.replace('{status}', t.statusReview || 'UNDER REVIEW') : 'Profile Status: UNDER REVIEW'}
            </h2>
            <p className="text-sm text-blue-700">
              {t.reviewDesc || 'Your profile is currently being reviewed by our team. You will be notified once it is approved.'}
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-red-800">
              {t.profileStatus ? t.profileStatus.replace('{status}', t.statusRejected || 'REJECTED') : 'Profile Status: REJECTED'}
            </h2>
            <p className="text-sm text-red-700">
              {t.rejectedDesc || 'Your profile review was not successful. Please update and resubmit.'}
            </p>
            {profile.rejectionReason && (
              <div className="mt-2 text-sm font-medium text-red-900 bg-red-100/50 p-2 rounded">
                Reason: {profile.rejectionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {t.profileStatus ? t.profileStatus.replace('{status}', t.statusSuspended || 'SUSPENDED') : 'Profile Status: SUSPENDED'}
            </h2>
            <p className="text-sm text-slate-700">
              {t.suspendedDesc || 'Your account has been suspended. Please contact support.'}
            </p>
          </div>
        </div>
      )}

      {!isApproved && !isPendingReview && !isRejected && !isSuspended && (
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
              {t.hiddenDesc || 'Your profile is hidden. You must add a bio and hourly rate, then submit for review to go live.'}
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
        user={profile.user}
      />
    </div>
  )
}

