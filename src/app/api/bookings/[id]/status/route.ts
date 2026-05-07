import { NextResponse } from 'next/server'
import { db } from '@/db'
import { bookings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { status } = await req.json()
    const validStatuses = ['CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, params.id),
      with: { caregiver: true }
    })

    if (!booking || booking.caregiver.userId !== session.user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const [updated] = await db.update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, params.id))
      .returning()

    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
