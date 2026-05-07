import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { AdminCaregiverList } from './admin-caregiver-list'

export default async function AdminPage() {
  const { authorized } = await requireAuth(['ADMIN'])
  if (!authorized) redirect('/login')

  const caregiversData = await db.query.caregiverProfiles.findMany({
    with: {
      user: {
        columns: {
          name: true,
          email: true,
          phone: true,
        },
      },
      certificates: true,
      experiences: true,
    },
    orderBy: [desc(caregiverProfiles.createdAt)],
  })

  // Map to match expected AdminCaregiverList props (including _count simulation)
  const caregivers = caregiversData.map(cg => ({
    ...cg,
    _count: {
      certificates: cg.certificates.length,
      experiences: cg.experiences.length,
    }
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-slate-600">
        Review, approve, or remove caregiver profiles.
      </p>
      <AdminCaregiverList caregivers={caregivers} />
    </div>
  )
}
