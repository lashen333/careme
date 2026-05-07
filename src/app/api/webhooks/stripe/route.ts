import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { bookings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2026-02-25.clover',
})

export async function POST(req: Request) {
    const body = await req.text()
    const headerPayload = headers()
    const signature = headerPayload.get('stripe-signature') as string

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
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
                    status: 'CONFIRMED', // Automatically confirm once paid, or keep PENDING for caregiver manual confirm
                })
                .where(eq(bookings.id, bookingId))
            console.log(`Payment confirmed for booking: ${bookingId}`)
        }
    }

    return new NextResponse('Webhook received', { status: 200 })
}
