import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
    const session = await getSession()
    if (!session?.user || session.user.role !== 'CAREGIVER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const profile = await db.query.caregiverProfiles.findFirst({
            where: eq(caregiverProfiles.userId, session.user.id),
            with: {
                experiences: true,
                certificates: true,
            },
        })

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        if (profile.status === 'APPROVED') {
            return NextResponse.json({ error: 'Profile is already published' }, { status: 400 })
        }

        if (profile.status === 'PENDING_REVIEW') {
            return NextResponse.json({ error: 'Your profile is already under admin review.' }, { status: 400 })
        }

        // Validation checks before allowing submission
        if (!profile.bio || profile.bio.trim() === '') {
            return NextResponse.json({ error: 'Bio is required to submit for review.' }, { status: 400 })
        }
        if (profile.hourlyRate <= 0) {
            return NextResponse.json({ error: 'A valid hourly rate is required to submit for review.' }, { status: 400 })
        }

        // Set status to PENDING_REVIEW — admin must approve before caregiver appears publicly
        const [updatedProfile] = await db.update(caregiverProfiles)
            .set({
                status: 'PENDING_REVIEW',
                updatedAt: new Date(),
            })
            .where(eq(caregiverProfiles.id, profile.id))
            .returning()

        return NextResponse.json(updatedProfile)
    } catch (e) {
        console.error('Failed to submit profile for review', e)
        return NextResponse.json({ error: 'Failed to submit profile for review' }, { status: 500 })
    }
}
