import Link from 'next/link'
import { db } from '@/db'
import { caregiverProfiles, users } from '@/db/schema'
import { eq, desc, ilike, and, or, gte, lte, sql } from 'drizzle-orm'
import { formatCurrency, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Star, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cookies } from 'next/headers'
import { getDictionary } from '@/i18n'

async function getCaregivers(search?: string, minPrice?: number, maxPrice?: number, page = 1, limit = 12) {
  const baseConditions = [eq(caregiverProfiles.status, 'APPROVED')]
  
  if (minPrice !== undefined) {
    baseConditions.push(gte(caregiverProfiles.hourlyRate, minPrice))
  }
  if (maxPrice !== undefined) {
    baseConditions.push(lte(caregiverProfiles.hourlyRate, maxPrice))
  }

  let searchCondition = null
  if (search) {
    searchCondition = or(
      ilike(caregiverProfiles.specializations, `%${search}%`),
      ilike(users.name, `%${search}%`)
    )
  }

  const finalConditions = searchCondition 
    ? and(...baseConditions, searchCondition)
    : and(...baseConditions)

  // Get total count
  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(caregiverProfiles)
    .innerJoin(users, eq(caregiverProfiles.userId, users.id))
    .where(finalConditions)

  const total = Number(countResult.count)
  if (total === 0) {
    return { caregivers: [], total: 0, totalPages: 0 }
  }

  // Get IDs for the current page
  const offset = (page - 1) * limit
  const idsResult = await db.select({ id: caregiverProfiles.id })
    .from(caregiverProfiles)
    .innerJoin(users, eq(caregiverProfiles.userId, users.id))
    .where(finalConditions)
    .orderBy(desc(caregiverProfiles.createdAt))
    .limit(limit)
    .offset(offset)

  const ids = idsResult.map(r => r.id)

  // Fetch full profiles for these IDs
  const caregivers = await db.query.caregiverProfiles.findMany({
    where: (cp, { inArray }) => inArray(cp.id, ids),
    with: {
      user: {
        columns: {
          name: true,
          avatar: true,
        },
      },
      certificates: true,
      reviews: {
        columns: {
          rating: true,
        }
      }
    },
    orderBy: [desc(caregiverProfiles.createdAt)],
  })

  return {
    caregivers,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

export default async function CaregiversPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; min?: string; max?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q || ''
  const min = params.min ? parseFloat(params.min) : undefined
  const max = params.max ? parseFloat(params.max) : undefined
  const page = params.page ? parseInt(params.page) : 1
  const limit = 12

  const { caregivers, totalPages, total } = await getCaregivers(q, min, max, page, limit)

  const cookieStore = cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const fullDict = await getDictionary(locale)
  const t = fullDict.caregivers || {}

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{t.title || 'Find Caregivers'}</h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl">
            {t.description || 'Browse verified caregivers. View profiles, experience, and book the right fit.'}
          </p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Showing {caregivers.length} of {total} results
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-12 border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <form className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <Search className="h-5 w-5 text-slate-400" />
              <Input 
                name="q"
                defaultValue={q}
                placeholder="Search by specialty (e.g. elderly care, nursing)..." 
                className="border-0 focus-visible:ring-0 px-0 h-auto text-base placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center px-4 py-3 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Price:</span>
                <Input 
                  name="min"
                  type="number"
                  defaultValue={min}
                  placeholder="Min" 
                  className="w-20 h-9 text-sm"
                />
                <span className="text-slate-300">-</span>
                <Input 
                  name="max"
                  type="number"
                  defaultValue={max}
                  placeholder="Max" 
                  className="w-20 h-9 text-sm"
                />
              </div>
              <Button type="submit" size="sm" className="bg-primary-600 hover:bg-primary-700">
                Apply
              </Button>
              {(q || min || max) && (
                <Button asChild variant="ghost" size="sm" className="text-slate-500">
                  <Link href="/caregivers">
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {caregivers.map((cg) => {
          const avgRating = cg.reviews.length > 0
            ? cg.reviews.reduce((acc, r) => acc + r.rating, 0) / cg.reviews.length
            : 0

          return (
            <Link key={cg.id} href={`/caregivers/${cg.id}`}>
              <Card className="h-full transition-all duration-300 hover:border-primary-300 hover:shadow-xl group">
                <CardContent className="p-0">
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {cg.user.avatar ? (
                      <img
                        src={cg.user.avatar}
                        alt={cg.user.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-300">
                        {cg.user.name.charAt(0)}
                      </div>
                    )}
                    {cg.kycVerified && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="success" className="flex items-center gap-1 shadow-sm backdrop-blur-md bg-emerald-500/90 text-white border-0">
                          <Shield className="h-3 w-3 fill-white/20" />
                          {t.verified || 'Verified'}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{cg.user.name}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className={cn("h-4 w-4", avgRating > 0 ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                        <span className="text-sm font-bold text-slate-900">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                    
                    <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                      {cg.experienceYears} {t.yearsExperience || 'years exp'}
                      {cg.reviews.length > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>{cg.reviews.length} reviews</span>
                        </>
                      )}
                    </p>

                    {cg.specializations && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {cg.specializations.split(',').slice(0, 2).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-0">
                            {s.trim()}
                          </Badge>
                        ))}
                        {cg.specializations.split(',').length > 2 && (
                          <span className="text-[10px] text-slate-400 ml-1">+{cg.specializations.split(',').length - 2}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                      <p className="font-bold text-lg text-primary-600">
                        {formatCurrency(cg.hourlyRate)}<span className="text-sm font-normal text-slate-400">/{t.hour || 'hr'}</span>
                      </p>
                      <div className="text-[10px] font-bold text-primary-500 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        View Profile →
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2 border-t border-slate-100 pt-8">
          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={page <= 1}
            className={cn(page <= 1 && "pointer-events-none opacity-50")}
          >
            <Link href={{
              pathname: '/caregivers',
              query: { ...params, page: page - 1 },
            }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Link>
          </Button>
          
          <div className="flex items-center gap-1 px-4">
            <span className="text-sm font-medium text-slate-900">Page {page}</span>
            <span className="text-sm text-slate-500 text-slate-400">of {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={page >= totalPages}
            className={cn(page >= totalPages && "pointer-events-none opacity-50")}
          >
            <Link href={{
              pathname: '/caregivers',
              query: { ...params, page: page + 1 },
            }}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {caregivers.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <p className="text-slate-600">{t.noCaregivers || 'No verified caregivers yet.'}</p>
          <p className="mt-1 text-sm text-slate-500">{t.noCaregiversDesc || 'Check back soon or sign up as a caregiver.'}</p>
        </div>
      )}
    </div>
  )
}
