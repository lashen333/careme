import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { bookings as bookingsTable } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Activity, Briefcase, Star } from 'lucide-react'
import { LiveTracker } from './live-tracker'
import { ReviewForm } from '@/components/review-form'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

import { CancelBookingButton } from './cancel-booking-button'

export default async function PatientDashboardPage() {
  const { authorized, session } = await requireAuth(['PATIENT_OWNER'])
  if (!authorized || !session?.user) redirect('/login')

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.dashboard || {}

    const bookings = await db.query.bookings.findMany({
    where: eq(bookingsTable.patientOwnerId, session.user.id),
    with: {
      caregiver: {
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
      },
      review: true,
    },
    orderBy: [desc(bookingsTable.createdAt)],
  })

  // Calculate stats
  let activeBookingsCount = 0

  const bookingsWithCost = bookings.map(b => {
    const hours = Math.max(1, (b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60))
    const estimatedCost = hours * b.caregiver.hourlyRate

    if (b.status === 'CONFIRMED' || b.status === 'PENDING') {
      activeBookingsCount++
    }

    return { ...b, estimatedCost }
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.title || 'Dashboard'}</h1>
        <p className="mt-1 text-slate-600">
          {t.welcomePatient ? t.welcomePatient.replace('{name}', session.user.name || '') : `Welcome back, ${session.user.name}. Track your caregiver bookings here.`}
        </p>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{t.activeBookings || 'Active Bookings'}</p>
                <p className="text-2xl font-bold text-slate-900">{activeBookingsCount}</p>
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{t.allBookings || 'All Bookings'}</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/caregivers">{t.findCaregivers || 'Find Caregivers'}</Link>
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {bookingsWithCost.map((b) => (
            <Card key={b.id} className={b.status === 'COMPLETED' && !b.review ? "border-primary-200 bg-primary-50/30" : ""}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {b.caregiver.user.name}
                      </h3>
                      <LiveTracker status={b.status} />
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
                      {t.estimatedCost || 'Estimated Cost'}: {formatCurrency(b.estimatedCost)}
                    </p>
                    {b.cancellationReason && (
                      <p className="mt-2 text-sm text-red-600">
                        {t.cancellation || 'Cancellation'}: {b.cancellationReason}
                      </p>
                    )}
                  </div>
                  {['PENDING', 'CONFIRMED'].includes(b.status) && (
                    <div className="flex-shrink-0">
                      <CancelBookingButton bookingId={b.id} />
                    </div>
                  )}
                </div>

                {b.status === 'COMPLETED' && !b.review && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Leave a Review</h4>
                    <ReviewForm bookingId={b.id} />
                  </div>
                )}

                {b.review && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < b.review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                    {b.review.comment && (
                      <p className="text-sm text-slate-600 italic">"{b.review.comment}"</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {bookings.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">{t.noBookingsPatient || 'No bookings yet.'}</p>
              <Button asChild className="mt-4">
                <Link href="/caregivers">{t.findCaregivers || 'Find Caregivers'}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
