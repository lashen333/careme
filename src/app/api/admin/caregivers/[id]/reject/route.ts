import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
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
  const body = await req.json().catch(() => ({}))
  const reason = body.reason || 'Rejected by admin'
  const suspend = body.suspend === true

  await db.update(caregiverProfiles)
    .set({
      status: suspend ? 'SUSPENDED' : 'REJECTED',
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(caregiverProfiles.id, id))

  return NextResponse.json({ success: true })
}
