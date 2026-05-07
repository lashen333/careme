import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'

export default async function DashboardRedirectPage() {
  const { authorized, session } = await requireAuth()
  
  if (!authorized || !session?.user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  } else if (session.user.role === 'CAREGIVER') {
    redirect('/dashboard/caregiver')
  } else {
    redirect('/dashboard/patient')
  }
}
