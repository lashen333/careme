import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  bio: z.string().nullable(),
  experienceYears: z.number(),
  hourlyRate: z.number(),
  specializations: z.string(),
  kycDocumentUrl: z
    .union([z.string().url(), z.literal(''), z.null()])
    .transform((v) => (v && v !== '' ? v : null)),
})

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const profile = await db.query.caregiverProfiles.findFirst({
      where: eq(caregiverProfiles.userId, session.user.id),
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await db.update(caregiverProfiles)
      .set({
        bio: data.bio,
        experienceYears: data.experienceYears,
        hourlyRate: data.hourlyRate,
        specializations: data.specializations,
        kycDocumentUrl: data.kycDocumentUrl,
        status: profile.status === 'REJECTED' ? 'PENDING' : profile.status,
        updatedAt: new Date(),
      })
      .where(eq(caregiverProfiles.id, profile.id))

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
