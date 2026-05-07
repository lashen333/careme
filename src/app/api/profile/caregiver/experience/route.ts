import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles, experiences } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  title: z.string(),
  organization: z.string().nullable(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  current: z.boolean(),
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

    await db.insert(experiences).values({
      caregiverId: profile.id,
      title: data.title,
      organization: data.organization,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      current: data.current,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
