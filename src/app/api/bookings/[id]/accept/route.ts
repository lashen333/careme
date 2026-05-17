import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles, bookings, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { sendBookingAcceptedToPatient } from '@/lib/email'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

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
    with: {
      patientOwner: { columns: { name: true, email: true } },
    },
  })
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  await db.update(bookings)
    .set({ status: 'CONFIRMED', cancellationReason: null, updatedAt: new Date() })
    .where(eq(bookings.id, id))

  // Send email notification to patient
  try {
    await sendBookingAcceptedToPatient({
      patientEmail: booking.patientOwner.email,
      patientName: booking.patientOwner.name,
      caregiverName: session.user.name,
      startDate: booking.startDate,
    })
  } catch (emailErr) {
    console.error('Failed to send booking accepted email:', emailErr)
  }

  return NextResponse.json({ success: true })
}
