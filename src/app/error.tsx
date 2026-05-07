'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Unhandled runtime error:', error)
    }, [error])

    const { t: fullDict } = useI18n()
    const t = fullDict.error || {}

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
            <div className="rounded-2xl bg-slate-50 p-8 shadow-sm border border-slate-100 max-w-md w-full">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{t.title || 'Something went wrong'}</h2>
                <p className="text-slate-600 mb-6">
                    {t.desc || 'We apologize for the inconvenience. Our team has been notified.'}
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={() => reset()}>{t.tryAgain || 'Try again'}</Button>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>
                        {t.returnHome || 'Return Home'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
