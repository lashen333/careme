import 'dotenv/config';
import { db } from './index';
import { users, caregiverProfiles, patientProfiles } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');

  const seedUsers = [
    {
      name: 'Admin User',
      email: 'admin@careme.com',
      password: 'admin123',
      role: 'ADMIN',
    },
    {
      name: 'Caregiver User',
      email: 'caregiver@careme.com',
      password: 'caregiver123',
      role: 'CAREGIVER',
    },
    {
      name: 'Patient Owner User',
      email: 'patient@careme.com',
      password: 'patient123',
      role: 'PATIENT_OWNER',
    },
  ];

  for (const seedUser of seedUsers) {
    const existing = await db.select().from(users).where(eq(users.email, seedUser.email)).limit(1);
    
    if (existing.length > 0) {
      console.log(`User ${seedUser.email} already exists, skipping...`);
      continue;
    }

    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    
    const [user] = await db.insert(users).values({
      name: seedUser.name,
      email: seedUser.email,
      passwordHash: passwordHash,
      role: seedUser.role as any,
    }).returning();

    console.log(`Created user: ${user.email} with role ${user.role}`);

    if (user.role === 'CAREGIVER') {
      await db.insert(caregiverProfiles).values({
        userId: user.id,
        status: 'APPROVED',
        bio: 'Experienced caregiver ready to help.',
        hourlyRate: 25,
        experienceYears: 5,
      });
      console.log(`Created caregiver profile for ${user.email}`);
    }

    if (user.role === 'PATIENT_OWNER') {
      await db.insert(patientProfiles).values({
        userId: user.id,
      });
      console.log(`Created patient profile for ${user.email}`);
    }
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
