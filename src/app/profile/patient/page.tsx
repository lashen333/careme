import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { patientProfiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { PatientProfileForm } from './patient-profile-form'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

export default async function PatientProfilePage() {
  const { authorized, session } = await requireAuth(['PATIENT_OWNER'])
  if (!authorized || !session?.user) redirect('/login')

  const profile = await db.query.patientProfiles.findFirst({
    where: eq(patientProfiles.userId, session.user.id),
    with: {
      user: true,
    }
  })

  const user = profile?.user || await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) redirect('/')

  // Create an empty profile object if it doesn't exist yet to simplify the form
  const initialProfile = profile || {
    id: '',
    userId: session.user.id,
    address: '',
    emergencyContact: '',
    patientNotes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.profile || {}

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t.patientProfileTitle || 'Patient Profile'}</h1>
        <p className="mt-2 text-slate-600">
          {t.patientProfileDesc || 'Update your personal care information. This helps caregivers understand your needs better.'}
        </p>
      </div>

      <PatientProfileForm profile={initialProfile} user={user} />
    </div>
  )
}
