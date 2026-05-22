import { db } from '../src/lib/db'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_resnor_salt_2024').digest('hex')
}

async function seedDemoUsers() {
  console.log('Seeding demo users...')

  // Upsert demo users with passwords
  const demoUsers = [
    {
      email: 'rafiq@diu.edu.bd',
      name: 'Rafiq Ahmed',
      role: 'student',
      password: 'demo123',
      studentId: 'CSE-331',
      institution: 'Daffodil International University',
      phone: '01712345601',
      semester: '7th',
    },
    {
      email: 'dr.khan@diu.edu.bd',
      name: 'Dr. Aminul Khan',
      role: 'teacher',
      password: 'demo123',
      institution: 'Department of CSE, DIU',
    },
    {
      email: 'fatima@diu.edu.bd',
      name: 'Fatima Begum',
      role: 'student',
      password: 'demo123',
      studentId: 'CSE-332',
      institution: 'Daffodil International University',
      phone: '01712345602',
      semester: '5th',
    },
    {
      email: 'tasnim@diu.edu.bd',
      name: 'Tasnim Akter',
      role: 'student',
      password: 'demo123',
      studentId: 'CSE-330',
      institution: 'Daffodil International University',
      phone: '01712345603',
      semester: '3rd',
    },
  ]

  for (const u of demoUsers) {
    const existing = await db.user.findUnique({ where: { email: u.email } })
    if (!existing) {
      await db.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash: hashPassword(u.password),
          studentId: u.studentId || null,
          institution: u.institution || null,
          phone: u.phone || null,
          semester: u.semester || null,
        },
      })
      console.log(`  Created user: ${u.email} (${u.role})`)
    } else {
      // Update password if missing
      if (!existing.passwordHash) {
        await db.user.update({
          where: { email: u.email },
          data: { passwordHash: hashPassword(u.password) },
        })
        console.log(`  Updated password for: ${u.email}`)
      } else {
        console.log(`  User exists: ${u.email} (${u.role})`)
      }
    }
  }

  console.log('Demo users seeded successfully!')
}

seedDemoUsers()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => {
    void db.$disconnect()
  })
