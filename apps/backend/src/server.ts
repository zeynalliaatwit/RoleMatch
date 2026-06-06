// apps/backend/src/server.ts
import app from './app.js';
import dotenv from 'dotenv';
import { db } from './db/index.js';
import { users, profiles } from './db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function seedAdminUser() {
  const adminEmail = 'admin@rolematch.com';
  const adminPassword = 'admin'; // Change this if you prefer!

  try {
    // 1. Check if the admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));

    if (existingAdmin.length === 0) {
      console.log('🌱 Seeding default admin account...');

      // 2. Hash the password just like your register route does
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // 3. Insert the user into the database
      const newUserResult = await db.insert(users).values({
        email: adminEmail,
        passwordHash: hashedPassword,
        authProvider: 'local'
      }).returning();

      const createdUser = newUserResult[0];

      // 4. Create the corresponding profile for the admin
      if (createdUser) {
        await db.insert(profiles).values({
          userId: createdUser.id,
          fullName: 'RoleMatch Admin',
          dateOfBirth: '2000-01-01',
        });
        console.log('✅ Admin account created!');
        console.log(`➡️  Email: ${adminEmail}`);
        console.log(`➡️  Password: ${adminPassword}`);
      }
    } else {
      console.log('✅ Default admin account is ready to go.');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
}

app.listen(PORT, async () => {
  await seedAdminUser();
  console.log(`🚀 RoleMatch Server executing fluidly on http://localhost:${PORT}`);
});