import { NextResponse } from 'next/server'
import { db } from '@/db'
import { patientProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const patientProfileSchema = z.object({
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  patientNotes: z.string().optional(),
})

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'PATIENT_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = patientProfileSchema.parse(body)

    // Upsert logic: Check if exists first
    const existing = await db.query.patientProfiles.findFirst({
      where: eq(patientProfiles.userId, session.user.id),
    })

    if (existing) {
      const [updated] = await db
        .update(patientProfiles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(patientProfiles.userId, session.user.id))
        .returning()
      return NextResponse.json(updated)
    } else {
      const [inserted] = await db
        .insert(patientProfiles)
        .values({
          userId: session.user.id,
          ...data,
        })
        .returning()
      return NextResponse.json(inserted)
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error('Patient profile update error:', e)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
