import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { caregiverProfiles, bookings as bookingsTable } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, DollarSign, Clock, Briefcase } from 'lucide-react'
import { BookingActions } from './booking-actions'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

export default async function CaregiverDashboardPage() {
  const { authorized, session } = await requireAuth(['CAREGIVER'])
  if (!authorized || !session?.user) redirect('/login')

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.dashboard || {}

  const profile = await db.query.caregiverProfiles.findFirst({
    where: eq(caregiverProfiles.userId, session.user.id),
  })
  if (!profile) redirect('/profile/caregiver')

  const bookings = await db.query.bookings.findMany({
    where: eq(bookingsTable.caregiverId, profile.id),
    with: {
      patientOwner: {
        columns: {
          name: true,
          phone: true,
        },
      },
    },
    orderBy: [desc(bookingsTable.createdAt)],
  })

  // Calculate stats
  let totalEarnings = 0
  let pendingEarnings = 0

  const bookingsWithCost = bookings.map(b => {
    const hours = Math.max(1, (b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60))
    const estimatedCost = hours * profile.hourlyRate

    if (b.status === 'COMPLETED') {
      totalEarnings += estimatedCost
    } else if (b.status === 'CONFIRMED' || b.status === 'PENDING') {
      pendingEarnings += estimatedCost
    }

    return { ...b, estimatedCost }
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.title || 'Dashboard'}</h1>
          <p className="mt-1 text-slate-600">
            {t.welcomeCaregiver ? t.welcomeCaregiver.replace('{name}', session.user.name || '') : `Welcome back, ${session.user.name}. Here's an overview of your activity.`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/profile/caregiver">{t.editProfile || 'Edit Profile'}</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{t.totalEarnings || 'Total Earnings'}</p>
                <p className="text-2xl font-bold text-slate-900">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{t.pendingEarnings || 'Pending Earnings'}</p>
                <p className="text-2xl font-bold text-slate-900">${pendingEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{t.totalBookings || 'Total Bookings'}</p>
                <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-slate-900">{t.recentBookings || 'Recent Bookings'}</h2>
        <div className="mt-6 space-y-4">
          {bookingsWithCost.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {b.patientOwner.name}
                      </h3>
                      <Badge
                        variant={
                          b.status === 'CONFIRMED' || b.status === 'COMPLETED'
                            ? 'success'
                            : b.status === 'CANCELLED'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {formatDate(b.startDate)} – {formatDate(b.endDate)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      {b.locationType === 'HOME'
                        ? b.address
                        : `${b.hospitalName} – Ward ${b.wardNumber}, Bed ${b.bedNumber}`}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {t.estimatedCost || 'Estimated Cost'}: ${b.estimatedCost.toFixed(2)}
                    </p>
                    {b.notes && (
                      <p className="mt-2 text-sm text-slate-500">{b.notes}</p>
                    )}
                    {b.patientOwner.phone && (
                      <p className="mt-1 text-sm text-slate-500">
                        {t.phone || 'Phone'}: {b.patientOwner.phone}
                      </p>
                    )}
                  </div>
                  {['PENDING', 'CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(b.status) && (
                    <BookingActions bookingId={b.id} initialStatus={b.status} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {bookings.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">{t.noBookingsCaregiver || 'No booking requests yet.'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t.noBookingsCaregiverDesc || 'Patient owners will see your profile and can request your services.'}
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/profile/caregiver">{t.completeProfile || 'Complete your profile'}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
