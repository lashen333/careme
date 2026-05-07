import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles, certificates } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  issuer: z.string().nullable(),
  documentUrl: z.string().url(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'CAREGIVER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const profile = await db.query.caregiverProfiles.findFirst({
      where: eq(caregiverProfiles.userId, session.user.id),
    })
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await db.insert(certificates).values({
      caregiverId: profile.id,
      name: data.name,
      issuer: data.issuer,
      documentUrl: data.documentUrl,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
