import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { caregiverProfiles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Calendar, Award, Briefcase } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

async function getCaregiver(id: string) {
  return db.query.caregiverProfiles.findFirst({
    where: and(
      eq(caregiverProfiles.id, id),
      eq(caregiverProfiles.status, 'APPROVED')
    ),
    with: {
      user: {
        columns: {
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      experiences: {
        orderBy: (experiences, { desc }) => [desc(experiences.startDate)],
      },
      certificates: true,
    },
  })
}

export default async function CaregiverProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  const caregiver = await getCaregiver(id)

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const tProfile = fullDict.caregiverProfile || {}
  const tCaregivers = fullDict.caregivers || {}

  if (!caregiver) notFound()

  const isPatientOwner = session?.user?.role === 'PATIENT_OWNER'

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0">
                  {caregiver.user.avatar ? (
                    <img
                      src={caregiver.user.avatar}
                      alt={caregiver.user.name}
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700">
                      {caregiver.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-900">{caregiver.user.name}</h1>
                    {caregiver.kycVerified && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {tCaregivers.verified || 'Verified'}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-slate-600">
                    {caregiver.experienceYears} {tCaregivers.yearsExperience || 'years experience'}
                  </p>
                  {caregiver.specializations && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {caregiver.specializations.split(',').map((s) => (
                        <Badge key={s} variant="primary">
                          {s.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {caregiver.bio && (
                    <p className="mt-4 text-slate-600">{caregiver.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {caregiver.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {tProfile.experience || 'Experience'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {caregiver.experiences.map((exp) => (
                    <li key={exp.id} className="border-l-2 border-primary-200 pl-4">
                      <p className="font-medium text-slate-900">{exp.title}</p>
                      {exp.organization && (
                        <p className="text-sm text-slate-600">{exp.organization}</p>
                      )}
                      <p className="text-sm text-slate-500">
                        {formatDate(exp.startDate)} –{' '}
                        {exp.current ? (tProfile.present || 'Present') : exp.endDate ? formatDate(exp.endDate) : (tProfile.na || 'N/A')}
                      </p>
                      {exp.description && (
                        <p className="mt-1 text-sm text-slate-600">{exp.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {caregiver.certificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {tProfile.certificates || 'Certificates'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {caregiver.certificates.map((cert) => (
                    <li key={cert.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                      <div>
                        <p className="font-medium text-slate-900">{cert.name}</p>
                        {cert.issuer && (
                          <p className="text-sm text-slate-500">{tProfile.issuedBy || 'Issued by '} {cert.issuer}</p>
                        )}
                      </div>
                      {cert.expiryDate && (
                        <span className="text-xs text-slate-500">
                          {tProfile.expires || 'Expires '} {formatDate(cert.expiryDate)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <p className="text-3xl font-bold text-primary-600">
                {formatCurrency(caregiver.hourlyRate)}
                <span className="text-base font-normal text-slate-500">/{tCaregivers.hour || 'hour'}</span>
              </p>
              {isPatientOwner ? (
                <Button asChild className="mt-4 w-full" size="lg">
                  <Link href={`/book/${caregiver.id}`}>
                    <Calendar className="h-4 w-4" />
                    {tProfile.bookCaregiver || 'Book Caregiver'}
                  </Link>
                </Button>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  {tProfile.logInToBook || 'Log in as a patient owner to book this caregiver.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
