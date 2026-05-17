import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })

    // For security reasons, don't reveal if the email exists
    if (!user) {
      return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' })
    }

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    await db.update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
      })
      .where(eq(users.id, user.id))

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token,
    })

    return NextResponse.json({ message: 'If an account exists with this email, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
