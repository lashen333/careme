import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const profile = await db.query.caregiverProfiles.findFirst({
    where: eq(caregiverProfiles.id, id),
    columns: { userId: true },
  })
  if (!profile) {
    return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 })
  }

  await db.delete(users).where(eq(users.id, profile.userId))

  return NextResponse.json({ success: true })
}
