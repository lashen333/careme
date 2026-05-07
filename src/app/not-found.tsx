'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/components/i18n-provider'

export default function NotFound() {
    const { t: fullDict } = useI18n()
    const t = fullDict.notFound || {}

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full">
                <h1 className="text-6xl font-extrabold text-primary-600 mb-4">404</h1>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.title || 'Page not found'}</h2>
                <p className="text-slate-600 mb-8">
                    {t.desc || "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist."}
                </p>
                <Button asChild size="lg">
                    <Link href="/">{t.returnHome || 'Return to Home'}</Link>
                </Button>
            </div>
        </div>
    )
}
