// Replaces Prisma enums (removed due to SQLite limitation)
export type UserRole = 'ADMIN' | 'CAREGIVER' | 'PATIENT_OWNER'
export type CaregiverStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type CareLocation = 'HOME' | 'HOSPITAL'