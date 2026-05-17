import { NextResponse } from 'next/server'
import { db } from '@/db'
import { reviews, bookings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'PATIENT_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = reviewSchema.parse(body)

    const booking = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.id, data.bookingId),
        eq(bookings.patientOwnerId, session.user.id)
      ),
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'You can only review completed bookings' }, { status: 400 })
    }

    // Check if review already exists
    const existingReview = await db.query.reviews.findFirst({
      where: eq(reviews.bookingId, data.bookingId),
    })

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 400 })
    }

    const [review] = await db.insert(reviews).values({
      bookingId: data.bookingId,
      patientOwnerId: session.user.id,
      caregiverId: booking.caregiverId,
      rating: data.rating,
      comment: data.comment,
    }).returning()

    return NextResponse.json(review)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error('Review creation error:', e)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
