import { pgTable, text, timestamp, boolean, real, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, type InferSelectModel } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export type User = InferSelectModel<typeof users>;
export type CaregiverProfile = InferSelectModel<typeof caregiverProfiles>;
export type Experience = InferSelectModel<typeof experiences>;
export type Certificate = InferSelectModel<typeof certificates>;
export type PatientProfile = InferSelectModel<typeof patientProfiles>;
export type Booking = InferSelectModel<typeof bookings>;

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  avatar: text('avatar'),
  role: text('role').default('PATIENT_OWNER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const caregiverProfiles = pgTable('caregiver_profiles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  experienceYears: integer('experience_years').default(0).notNull(),
  hourlyRate: real('hourly_rate').default(0).notNull(),
  specializations: text('specializations').default('').notNull(),
  status: text('status').default('PENDING').notNull(),
  kycVerified: boolean('kyc_verified').default(false).notNull(),
  kycDocumentUrl: text('kyc_document_url'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const experiences = pgTable('experiences', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  caregiverId: text('caregiver_id').notNull().references(() => caregiverProfiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  organization: text('organization'),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  current: boolean('current').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const certificates = pgTable('certificates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  caregiverId: text('caregiver_id').notNull().references(() => caregiverProfiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  issuer: text('issuer'),
  issuedDate: timestamp('issued_date'),
  expiryDate: timestamp('expiry_date'),
  documentUrl: text('document_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const patientProfiles = pgTable('patient_profiles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  patientNotes: text('patient_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  patientOwnerId: text('patient_owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  caregiverId: text('caregiver_id').notNull().references(() => caregiverProfiles.id, { onDelete: 'cascade' }),
  locationType: text('location_type').default('HOME').notNull(),
  address: text('address'),
  hospitalName: text('hospital_name'),
  wardNumber: text('ward_number'),
  bedNumber: text('bed_number'),
  floor: text('floor'),
  additionalInfo: text('additional_info'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  notes: text('notes'),
  status: text('status').default('PENDING').notNull(),
  cancellationReason: text('cancellation_reason'),
  stripeSessionId: text('stripe_session_id').unique(),
  paymentStatus: text('payment_status').default('UNPAID').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  caregiverProfile: one(caregiverProfiles, {
    fields: [users.id],
    references: [caregiverProfiles.userId],
  }),
  patientProfile: one(patientProfiles, {
    fields: [users.id],
    references: [patientProfiles.userId],
  }),
  bookingsAsOwner: many(bookings),
}));

export const caregiverProfilesRelations = relations(caregiverProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [caregiverProfiles.userId],
    references: [users.id],
  }),
  experiences: many(experiences),
  certificates: many(certificates),
  bookings: many(bookings),
}));

export const experiencesRelations = relations(experiences, ({ one }) => ({
  caregiverProfile: one(caregiverProfiles, {
    fields: [experiences.caregiverId],
    references: [caregiverProfiles.id],
  }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  caregiverProfile: one(caregiverProfiles, {
    fields: [certificates.caregiverId],
    references: [caregiverProfiles.id],
  }),
}));

export const patientProfilesRelations = relations(patientProfiles, ({ one }) => ({
  user: one(users, {
    fields: [patientProfiles.userId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  patientOwner: one(users, {
    fields: [bookings.patientOwnerId],
    references: [users.id],
  }),
  caregiver: one(caregiverProfiles, {
    fields: [bookings.caregiverId],
    references: [caregiverProfiles.id],
  }),
}));
