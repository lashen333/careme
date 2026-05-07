import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.profile || {}

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">{t.title || 'Profile'}</h1>
      <p className="mt-1 text-slate-600">{session.user.name}</p>
      <p className="text-sm text-slate-500">{session.user.email}</p>
      {session.user.role === 'CAREGIVER' && (
        <Button asChild className="mt-6">
          <Link href="/profile/caregiver">{t.editCaregiverProfile || 'Edit caregiver profile'}</Link>
        </Button>
      )}
    </div>
  )
}
