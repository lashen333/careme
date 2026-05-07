import type { UserRole } from '@/lib/types'

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: UserRole
    caregiverProfileId?: string
  }
}
