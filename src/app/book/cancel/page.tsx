import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

export default async function BookingCancelPage() {
    const cookieStore = cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
    const fullDict = await getDictionary(locale)
    const t = fullDict.bookingFlow || {}
    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="text-center">
                <XCircle className="mx-auto h-16 w-16 text-rose-500" />
                <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                    {t.cancelTitle || 'Payment Cancelled'}
                </h1>
                <p className="mt-4 text-base text-slate-600">
                    {t.cancelDesc || 'The booking request was not completed because the payment was cancelled. You have not been charged.'}
                </p>
                <div className="mt-8">
                    <Link
                        href="/caregivers"
                        className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                        {fullDict.dashboard?.findCaregivers || 'Find Caregivers'}
                    </Link>
                </div>
            </div>
        </div>
    )
}
