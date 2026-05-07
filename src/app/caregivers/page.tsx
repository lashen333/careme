import Link from 'next/link'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Star, MapPin } from 'lucide-react'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

async function getCaregivers() {
  return db.query.caregiverProfiles.findMany({
    where: eq(caregiverProfiles.status, 'APPROVED'),
    with: {
      user: {
        columns: {
          name: true,
          avatar: true,
        },
      },
      certificates: true,
    },
    orderBy: [desc(caregiverProfiles.createdAt)],
  })
}

export default async function CaregiversPage() {
  const caregivers = await getCaregivers()

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.caregivers || {}

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900">{t.title || 'Find Caregivers'}</h1>
        <p className="mt-2 text-slate-600">
          {t.description || 'Browse verified caregivers. View profiles, experience, and book the right fit.'}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {caregivers.map((cg) => (
          <Link key={cg.id} href={`/caregivers/${cg.id}`}>
            <Card className="h-full transition hover:border-primary-300 hover:shadow-md">
              <CardContent className="p-0">
                <div className="aspect-[4/3] bg-slate-100">
                  {cg.user.avatar ? (
                    <img
                      src={cg.user.avatar}
                      alt={cg.user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-slate-400">
                      {cg.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-slate-900">{cg.user.name}</h3>
                    {cg.kycVerified && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {t.verified || 'Verified'}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {cg.experienceYears} {t.yearsExperience || 'years experience'}
                    {cg.certificates.length > 0 && (
                      <> · {cg.certificates.length} {t.certificates || 'certificates'}</>
                    )}
                  </p>
                  {cg.specializations && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cg.specializations.split(',').slice(0, 3).map((s) => (
                        <Badge key={s} variant="primary" className="text-xs">
                          {s.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 font-semibold text-primary-600">
                    {formatCurrency(cg.hourlyRate)}/{t.hour || 'hr'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {caregivers.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <p className="text-slate-600">{t.noCaregivers || 'No verified caregivers yet.'}</p>
          <p className="mt-1 text-sm text-slate-500">{t.noCaregiversDesc || 'Check back soon or sign up as a caregiver.'}</p>
        </div>
      )}
    </div>
  )
}
