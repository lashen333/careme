import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

export default async function BookingSuccessPage() {
    const cookieStore = cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
    const fullDict = await getDictionary(locale)
    const t = fullDict.bookingFlow || {}
    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
                <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                    {t.successTitle || 'Payment Successful!'}
                </h1>
                <p className="mt-4 text-base text-slate-600">
                    {t.successDesc || 'Your booking request has been confirmed securely via Stripe. The caregiver has been notified.'}
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Link
                        href="/dashboard/patient"
                        className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                        {t.goToDashboard || 'Go to Dashboard'}
                    </Link>
                    <Link
                        href="/"
                        className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        {t.backHome || 'Back Home'}
                    </Link>
                </div>
            </div>
        </div>
    )
}
