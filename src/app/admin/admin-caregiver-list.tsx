'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Check, X, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Caregiver = {
  id: string
  status: string
  kycVerified: boolean
  experienceYears: number
  hourlyRate: number
  specializations: string
  user: { name: string; email: string; phone: string | null }
  _count: { certificates: number; experiences: number }
}

export function AdminCaregiverList({ caregivers }: { caregivers: Caregiver[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function approve(id: string) {
    setLoading(id)
    try {
      await fetch(`/api/admin/caregivers/${id}/approve`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function reject(id: string, reason?: string) {
    setLoading(id)
    try {
      await fetch(`/api/admin/caregivers/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this caregiver? This cannot be undone.')) return
    setLoading(id)
    try {
      await fetch(`/api/admin/caregivers/${id}/remove`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {caregivers.map((cg) => (
        <Card key={cg.id}>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{cg.user.name}</h3>
                  <Badge
                    variant={
                      cg.status === 'APPROVED'
                        ? 'success'
                        : cg.status === 'REJECTED'
                        ? 'danger'
                        : cg.status === 'SUSPENDED'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {cg.status}
                  </Badge>
                  {cg.kycVerified && (
                    <Badge variant="primary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      KYC
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{cg.user.email}</p>
                <p className="text-sm text-slate-500">
                  {cg.experienceYears} yrs · {formatCurrency(cg.hourlyRate)}/hr ·{' '}
                  {cg._count.certificates} certs
                </p>
                {cg.specializations && (
                  <p className="mt-1 text-xs text-slate-500">{cg.specializations}</p>
                )}
              </div>
              <div className="flex flex-shrink-0 gap-2">
                {cg.status === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approve(cg.id)}
                      disabled={!!loading}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reject(cg.id)}
                      disabled={!!loading}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {cg.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      fetch(`/api/admin/caregivers/${cg.id}/reject`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          reason: 'Suspended by admin',
                          suspend: true,
                        }),
                      }).then(() => router.refresh())
                    }
                    disabled={!!loading}
                    className="gap-1"
                  >
                    Suspend
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(cg.id)}
                  disabled={!!loading}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {caregivers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-600">
            No caregiver applications yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
