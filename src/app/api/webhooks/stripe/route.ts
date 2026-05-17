import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { bookings, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import {
  sendBookingConfirmationToPatient,
  sendBookingRequestToCaregiver,
} from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2026-02-25.clover',
})

export async function POST(req: Request) {
    const body = await req.text()
    const headerPayload = headers()
    const signature = headerPayload.get('stripe-signature') as string

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('STRIPE_WEBHOOK_SECRET is not set — webhook rejected')
        return new NextResponse('Webhook secret not configured', { status: 500 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`)
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
            await db.update(bookings)
                .set({
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED',
                })
                .where(eq(bookings.id, bookingId))

            console.log(`Payment confirmed for booking: ${bookingId}`)

            // ── Send email notifications ──────────────────────────────────
            try {
                const booking = await db.query.bookings.findFirst({
                    where: eq(bookings.id, bookingId),
                    with: {
                        patientOwner: { columns: { name: true, email: true } },
                        caregiver: {
                            with: {
                                user: { columns: { name: true, email: true } },
                            },
                        },
                    },
                })

                if (booking) {
                    await Promise.all([
                        sendBookingConfirmationToPatient({
                            patientEmail: booking.patientOwner.email,
                            patientName: booking.patientOwner.name,
                            caregiverName: booking.caregiver.user.name,
                            startDate: booking.startDate,
                            endDate: booking.endDate,
                            bookingId: booking.id,
                        }),
                        sendBookingRequestToCaregiver({
                            caregiverEmail: booking.caregiver.user.email,
                            caregiverName: booking.caregiver.user.name,
                            patientName: booking.patientOwner.name,
                            startDate: booking.startDate,
                            endDate: booking.endDate,
                            locationType: booking.locationType,
                            address: booking.address,
                            bookingId: booking.id,
                        }),
                    ])
                }
            } catch (emailErr) {
                // Non-fatal — log but don't fail the webhook
                console.error('Failed to send booking emails:', emailErr)
            }
            // ─────────────────────────────────────────────────────────────
        }
    }

    return new NextResponse('Webhook received', { status: 200 })
}
