import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('avatar') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Verify Supabase config
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase storage is not configured' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )

    // Generate unique file name
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`

    // Upload to avatars bucket
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 })
    }

    const { data: publicData } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName)
    const avatarUrl = publicData.publicUrl

    // Update user record in db
    await db.update(users)
      .set({
        avatar: avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({ success: true, avatarUrl })
  } catch (e: any) {
    console.error('Avatar update error:', e)
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }
}
