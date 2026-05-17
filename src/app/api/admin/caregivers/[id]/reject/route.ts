import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { sendCaregiverRejectedEmail } from '@/lib/email'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason = body.reason || 'Rejected by admin'
  const suspend = body.suspend === true

  const profile = await db.query.caregiverProfiles.findFirst({
    where: eq(caregiverProfiles.id, id),
    with: { user: { columns: { name: true, email: true } } },
  })

  await db.update(caregiverProfiles)
    .set({
      status: suspend ? 'SUSPENDED' : 'REJECTED',
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(caregiverProfiles.id, id))

  // Notify caregiver by email
  if (profile?.user) {
    try {
      await sendCaregiverRejectedEmail({
        caregiverEmail: profile.user.email,
        caregiverName: profile.user.name,
        reason,
      })
    } catch (emailErr) {
      console.error('Failed to send caregiver rejected email:', emailErr)
    }
  }

  return NextResponse.json({ success: true })
}
