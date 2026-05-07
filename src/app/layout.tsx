import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/navbar'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'
import { I18nProvider } from '@/components/i18n-provider'

export const metadata: Metadata = {
  title: 'Careme | Book Trusted Caregivers for Your Loved Ones',
  description:
    'Connect with verified caregivers. Book home or hospital care with experienced, certified professionals. Your loved ones deserve the best.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const dict = await getDictionary(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Providers>
          <I18nProvider dict={dict}>
            <Navbar dict={dict.navbar} currentLocale={locale} />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          </I18nProvider>
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
