import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users, caregiverProfiles, patientProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['CAREGIVER', 'PATIENT_OWNER']),
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    
    // Extract text fields
    const emailData = formData.get('email') as string
    const passwordData = formData.get('password') as string
    const nameData = formData.get('name') as string
    const phoneData = formData.get('phone') as string | null
    const roleData = formData.get('role') as 'CAREGIVER' | 'PATIENT_OWNER'
    
    const { email, password, name, phone, role } = registerSchema.parse({
      email: emailData,
      password: passwordData,
      name: nameData,
      phone: phoneData || undefined,
      role: roleData,
    })

    const existingRef = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existingRef.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    
    // Handle Avatar Image Upload
    let avatarUrl: string | null = null
    const avatarFile = formData.get('avatar') as File | null
    
    if (avatarFile && avatarFile.size > 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      )
      
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: false
        })
        
      if (!uploadError && data) {
        const { data: publicData } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName)
        avatarUrl = publicData.publicUrl
      }
    }

    // Process DB insert transaction manually or in series
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      phone: phone || null,
      role,
      avatar: avatarUrl,
    }).returning()

    if (role === 'CAREGIVER') {
      await db.insert(caregiverProfiles).values({ userId: user.id })
    }

    if (role === 'PATIENT_OWNER') {
      await db.insert(patientProfiles).values({ userId: user.id })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors }, { status: 400 })
    }
    console.error('Registration error:', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
