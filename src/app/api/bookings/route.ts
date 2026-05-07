import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles, bookings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  caregiverId: z.string(),
  patientOwnerId: z.string(),
  locationType: z.enum(['HOME', 'HOSPITAL']),
  address: z.string().nullable(),
  hospitalName: z.string().nullable(),
  wardNumber: z.string().nullable(),
  bedNumber: z.string().nullable(),
  floor: z.string().nullable(),
  additionalInfo: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().nullable(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'PATIENT_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    if (data.patientOwnerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caregiver = await db.query.caregiverProfiles.findFirst({
      where: and(
        eq(caregiverProfiles.id, data.caregiverId),
        eq(caregiverProfiles.status, 'APPROVED')
      ),
    })
    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 })
    }

    const [booking] = await db.insert(bookings).values({
      patientOwnerId: data.patientOwnerId,
      caregiverId: data.caregiverId,
      locationType: data.locationType,
      address: data.address,
      hospitalName: data.hospitalName,
      wardNumber: data.wardNumber,
      bedNumber: data.bedNumber,
      floor: data.floor,
      additionalInfo: data.additionalInfo,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      notes: data.notes,
      status: 'PENDING',
    }).returning()

    return NextResponse.json(booking)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
  }
}
