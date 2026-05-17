import { NextResponse } from 'next/server'
import { db } from '@/db'
import { bookings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const cancelSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'PATIENT_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { reason } = cancelSchema.parse(body)

  const booking = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.id, id),
      eq(bookings.patientOwnerId, session.user.id)
    ),
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Only allow cancellation if booking is PENDING or CONFIRMED
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return NextResponse.json(
      { error: 'This booking cannot be cancelled at its current stage.' },
      { status: 400 }
    )
  }

  await db.update(bookings)
    .set({
      status: 'CANCELLED',
      cancellationReason: reason || 'Cancelled by patient',
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))

  return NextResponse.json({ success: true })
}
