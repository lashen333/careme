import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles, bookings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason = body.reason || 'Cancelled by caregiver'

  const profile = await db.query.caregiverProfiles.findFirst({
    where: eq(caregiverProfiles.userId, session.user.id),
  })
  if (!profile) {
    return NextResponse.json({ error: 'Caregiver profile not found' }, { status: 404 })
  }

  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.id, id),
      eq(bookings.caregiverId, profile.id),
      eq(bookings.status, 'PENDING')
    ),
  })
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  await db.update(bookings)
    .set({ status: 'CANCELLED', cancellationReason: reason, updatedAt: new Date() })
    .where(eq(bookings.id, id))

  return NextResponse.json({ success: true })
}
