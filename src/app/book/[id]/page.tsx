import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { BookingForm } from './booking-form'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

async function getCaregiver(id: string) {
  return db.query.caregiverProfiles.findFirst({
    where: and(
      eq(caregiverProfiles.id, id),
      eq(caregiverProfiles.status, 'APPROVED')
    ),
    with: { user: { columns: { name: true } } },
  })
}

export default async function BookCaregiverPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { authorized, session } = await requireAuth(['PATIENT_OWNER'])
  const caregiver = await getCaregiver(id)

  if (!authorized || !session?.user) {
    redirect(`/login?callbackUrl=/book/${id}`)
  }

  if (!caregiver) notFound()

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.bookingFlow || {}

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">
        {t.bookTitle ? t.bookTitle.replace('{name}', caregiver.user.name) : `Book ${caregiver.user.name}`}
      </h1>
      <p className="mt-1 text-slate-600">
        {t.bookDesc || 'Complete the form below to request care. The caregiver will review and confirm.'}
      </p>
      <BookingForm
        caregiverId={caregiver.id}
        caregiverName={caregiver.user.name}
        patientOwnerId={session.user.id}
      />
    </div>
  )
}

