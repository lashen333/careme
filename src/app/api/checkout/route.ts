import { NextResponse } from 'next/server'
import { db } from '@/db'
import { caregiverProfiles, bookings } from '@/db/schema'
import { eq, and, or, lt, gt } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2026-02-25.clover',
})

const checkoutSchema = z.object({
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

    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
            { error: 'Stripe Secret Key is not configured in .env' },
            { status: 500 }
        )
    }

    try {
        const body = await req.json()
        const data = checkoutSchema.parse(body)

        if (data.patientOwnerId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const caregiver = await db.query.caregiverProfiles.findFirst({
            where: and(
                eq(caregiverProfiles.id, data.caregiverId),
                eq(caregiverProfiles.status, 'APPROVED')
            ),
            with: { user: true },
        })

        if (!caregiver) {
            return NextResponse.json({ error: 'Caregiver not found or not available' }, { status: 404 })
        }

        // ── Double-booking conflict check ────────────────────────────
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)

        if (start >= end) {
            return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 })
        }

        const conflict = await db.query.bookings.findFirst({
            where: and(
                eq(bookings.caregiverId, data.caregiverId),
                or(
                    // existing booking starts within the new window
                    and(gt(bookings.startDate, start), lt(bookings.startDate, end)),
                    // existing booking ends within the new window
                    and(gt(bookings.endDate, start), lt(bookings.endDate, end)),
                    // existing booking completely wraps the new window
                    and(lt(bookings.startDate, start), gt(bookings.endDate, end))
                )
            ),
        })

        if (conflict) {
            return NextResponse.json(
                { error: 'This caregiver is already booked for the selected time slot. Please choose a different time.' },
                { status: 409 }
            )
        }
        // ─────────────────────────────────────────────────────────────

        // Calculate duration in hours
        const durationHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)))
        const amountTotal = Math.round(durationHours * caregiver.hourlyRate * 100) // in cents

        if (amountTotal < 50) {
            return NextResponse.json({ error: 'Booking amount is too low' }, { status: 400 })
        }

        // 1. Create a PENDING booking in our database first
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
            startDate: start,
            endDate: end,
            notes: data.notes,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
        }).returning()

        // 2. Create Stripe Checkout Session
        const host = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${host}/book/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${host}/book/cancel`,
            client_reference_id: session.user.id,
            metadata: {
                bookingId: booking.id,
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Caregiving Service with ${caregiver.user.name}`,
                            description: `${durationHours} hours of service at $${caregiver.hourlyRate}/hr`,
                        },
                        unit_amount: amountTotal,
                    },
                    quantity: 1,
                },
            ],
        })

        // 3. Save sessionId to Booking
        await db.update(bookings)
            .set({ stripeSessionId: stripeSession.id })
            .where(eq(bookings.id, booking.id))

        return NextResponse.json({ url: stripeSession.url })
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: e.errors }, { status: 400 })
        }
        console.error('Checkout error:', e)
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }
}
