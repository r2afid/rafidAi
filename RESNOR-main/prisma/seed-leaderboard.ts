import { db } from '../src/lib/db'

function xpForLevel(level: number) {
  return 500 * level * (level - 1) / 2
}

function findLevel(totalXp: number) {
  let lv = 1
  while (totalXp >= xpForLevel(lv + 1)) lv++
  return lv
}

const students = [
  { name: 'Ayesha Rahman', email: 'ayesha@diu.edu.bd', xp: 18420, streak: 21, badges: 24, studentId: 'CSE-401' },
  { name: 'Farhan Islam', email: 'farhan@diu.edu.bd', xp: 17680, streak: 19, badges: 22, studentId: 'CSE-402' },
  { name: 'Tahmina Akter', email: 'tahmina@diu.edu.bd', xp: 16340, streak: 18, badges: 21, studentId: 'CSE-403' },
  { name: 'Sakib Hasan', email: 'sakib@diu.edu.bd', xp: 15290, streak: 16, badges: 19, studentId: 'CSE-404' },
  { name: 'Maliha Tabassum', email: 'maliha@diu.edu.bd', xp: 14850, streak: 20, badges: 20, studentId: 'CSE-405' },
  { name: 'Nusrat Jahan', email: 'nusrat@diu.edu.bd', xp: 11920, streak: 11, badges: 14, studentId: 'CSE-332' },
  { name: 'Imran Hossain', email: 'imran@diu.edu.bd', xp: 10870, streak: 13, badges: 13, studentId: 'CSE-406' },
  { name: 'Fatima Begum', email: 'fatima@diu.edu.bd', xp: 9650, streak: 15, badges: 12, studentId: 'CSE-332' },
  { name: 'Arif Uddin', email: 'arif@diu.edu.bd', xp: 9100, streak: 9, badges: 11, studentId: 'CSE-407' },
  { name: 'Sumaiya Islam', email: 'sumaiya@diu.edu.bd', xp: 8780, streak: 10, badges: 10, studentId: 'CSE-408' },
  { name: 'Tanvir Ahmed', email: 'tanvir@diu.edu.bd', xp: 8250, streak: 8, badges: 9, studentId: 'CSE-409' },
  { name: 'Sharmin Sultana', email: 'sharmin@diu.edu.bd', xp: 7400, streak: 7, badges: 8, studentId: 'CSE-410' },
  { name: 'Rakibul Islam', email: 'rakibul@diu.edu.bd', xp: 6890, streak: 6, badges: 7, studentId: 'CSE-411' },
  { name: 'Nadia Afrin', email: 'nadia@diu.edu.bd', xp: 5230, streak: 5, badges: 6, studentId: 'CSE-412' },
  { name: 'Karim Hossain', email: 'karim@diu.edu.bd', xp: 4500, streak: 4, badges: 5, studentId: 'CSE-413' },
  { name: 'Fatima Akter', email: 'fatima.akter@diu.edu.bd', xp: 3800, streak: 3, badges: 4, studentId: 'CSE-414' },
  { name: 'Tanvir Alam', email: 'tanvir.alam@diu.edu.bd', xp: 2900, streak: 2, badges: 3, studentId: 'CSE-415' },
  { name: 'Tasnim Akter', email: 'tasnim@diu.edu.bd', xp: 2100, streak: 1, badges: 2, studentId: 'CSE-330' },
  { name: 'Rafiq Ahmed', email: 'rafiq@diu.edu.bd', xp: 1500, streak: 0, badges: 1, studentId: 'CSE-331' },
]

async function seedLeaderboard() {
  console.log('Seeding leaderboard data...\n')

  // Ensure streak-related badges exist
  const badges = [
    { name: 'First Steps', description: 'Earn your first 500 XP', icon: '🌟', category: 'study', thresholdType: 'xp', thresholdValue: 500 },
    { name: 'Dedicated Learner', description: 'Earn 5000 total XP', icon: '🔥', category: 'study', thresholdType: 'xp', thresholdValue: 5000 },
    { name: 'Knowledge Seeker', description: 'Earn 10000 total XP', icon: '📚', category: 'study', thresholdType: 'xp', thresholdValue: 10000 },
    { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', thresholdType: 'streak_days', thresholdValue: 7 },
    { name: 'Consistency King', description: 'Maintain a 14-day streak', icon: '👑', category: 'streak', thresholdType: 'streak_days', thresholdValue: 14 },
    { name: 'Quiz Ace', description: 'Score 90%+ on a quiz', icon: '🎯', category: 'quiz', thresholdType: 'quiz_score', thresholdValue: 90 },
    { name: 'Study Marathon', description: 'Maintain a 21-day streak', icon: '🏃', category: 'streak', thresholdType: 'streak_days', thresholdValue: 21 },
  ]

  for (const badge of badges) {
    await db.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    })
  }
  console.log(`  Synced ${badges.length} badges`)

  const allBadges = await db.badge.findMany()

  // Create or update each student
  const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
  for (const s of students) {
    let user = await db.user.findUnique({ where: { email: s.email } })
    if (!user) {
      user = await db.user.create({
        data: {
          email: s.email,
          name: s.name,
          role: 'student',
          studentId: s.studentId,
          institution: 'Daffodil International University',
          phone: `017${Math.floor(Math.random() * 90000000 + 10000000)}`,
          semester: semesters[Math.floor(Math.random() * semesters.length)],
        },
      })
      console.log(`  Created user: ${s.email}`)
    } else {
      // Update existing user with missing fields
      const updates: any = {}
      if (!user.institution) updates.institution = 'Daffodil International University'
      if (!user.phone) updates.phone = `017${Math.floor(Math.random() * 90000000 + 10000000)}`
      if (!user.semester) updates.semester = semesters[Math.floor(Math.random() * semesters.length)]
      if (Object.keys(updates).length > 0) {
        await db.user.update({ where: { id: user.id }, data: updates })
      }
    }

    // Create StudentProgress
    const level = findLevel(s.xp)
    await db.studentProgress.upsert({
      where: { studentId: user.id },
      update: { xp: s.xp, level },
      create: { studentId: user.id, xp: s.xp, level },
    })

    // Create Streak
    const lastActive = new Date()
    lastActive.setDate(lastActive.getDate() - Math.max(0, 21 - s.streak))
    await db.streak.upsert({
      where: { studentId: user.id },
      update: {
        currentStreak: s.streak,
        longestStreak: Math.max(s.streak, Math.floor(s.xp / 1000) + 3),
        totalActiveDays: Math.floor(s.xp / 300) + s.streak,
        lastActiveDate: lastActive,
      },
      create: {
        studentId: user.id,
        currentStreak: s.streak,
        longestStreak: Math.max(s.streak, Math.floor(s.xp / 1000) + 3),
        totalActiveDays: Math.floor(s.xp / 300) + s.streak,
        lastActiveDate: lastActive,
      },
    })

    // Award earned badges based on XP thresholds
    const earnedBadgeNames: string[] = []
    for (const badge of allBadges) {
      if (badge.thresholdType === 'xp' && s.xp >= badge.thresholdValue) {
        earnedBadgeNames.push(badge.name)
      }
      if (badge.thresholdType === 'streak_days' && s.streak >= badge.thresholdValue) {
        earnedBadgeNames.push(badge.name)
      }
    }

    for (const badgeName of earnedBadgeNames) {
      const badge = allBadges.find(b => b.name === badgeName)
      if (!badge) continue
      await db.earnedBadge.upsert({
        where: { studentId_badgeId: { studentId: user.id, badgeId: badge.id } },
        update: {},
        create: { studentId: user.id, badgeId: badge.id },
      })
    }
  }

  // ── Create CSE courses and enrollments ──
  const cseCourses = [
    { code: 'CSE-411', name: 'Software Engineering' },
    { code: 'CSE-423', name: 'Artificial Intelligence' },
    { code: 'CSE-405', name: 'Computer Networks' },
    { code: 'CSE-417', name: 'Web Technologies' },
    { code: 'CSE-331', name: 'Database Systems' },
    { code: 'CSE-342', name: 'Operating Systems' },
    { code: 'CSE-353', name: 'Data Structures' },
  ]
  let teacher = await db.user.findFirst({ where: { role: 'teacher' } })
  if (!teacher) {
    teacher = await db.user.create({
      data: { email: 'teacher@diu.edu.bd', name: 'Dr. Teacher', role: 'teacher', passwordHash: 'dummy' },
    })
  }
  const courseRecords: { id: string; code: string; name: string }[] = []
  for (const c of cseCourses) {
    const course = await db.course.upsert({
      where: { id: c.code },
      update: { name: c.name, teacherId: teacher.id },
      create: { id: c.code, code: c.code, name: c.name, teacherId: teacher.id },
    })
    courseRecords.push(course)
  }

  const allStudents = await db.user.findMany({ where: { role: 'student' } })
  for (const student of allStudents) {
    for (const course of courseRecords) {
      const attendance = 65 + Math.floor(Math.random() * 35)
      const assignmentMark = 60 + Math.floor(Math.random() * 40)
      const presentationMark = 60 + Math.floor(Math.random() * 40)
      const midMark = 40 + Math.floor(Math.random() * 55)
      const finalMark = 45 + Math.floor(Math.random() * 50)
      await db.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
        update: { attendance, assignmentMark, presentationMark, midMark, finalMark },
        create: { studentId: student.id, courseId: course.id, attendance, assignmentMark, presentationMark, midMark, finalMark },
      })
    }
  }
  console.log(`  Enrolled ${allStudents.length} students in ${courseRecords.length} courses`)

  // Ensure a quiz exists for quiz attempt references
  let seedQuiz = await db.quiz.findFirst()
  if (!seedQuiz) {
    // Find any topic to link the quiz
    const topic = await db.topic.findFirst()
    if (topic) {
      seedQuiz = await db.quiz.create({
        data: { topicId: topic.id, title: 'General Quiz', difficulty: 'medium', timeLimit: 600 },
      })
    }
  }

  // Enrich profile data: quiz attempts + telemetry for each seeded student
  for (const s of students) {
    const user = await db.user.findUnique({ where: { email: s.email } })
    if (!user) continue

    // Quiz attempts
    if (seedQuiz) {
      const quizCount = 5 + Math.floor(Math.random() * 6)
      for (let q = 0; q < quizCount; q++) {
        const totalQ = 10
        const correct = 5 + Math.floor(Math.random() * 6)
        const completedAt = new Date(Date.now() - Math.floor(Math.random() * 90 * 86400000))
        await db.quizAttempt.upsert({
          where: { id: `${user.id}-quiz-${q}` },
          update: { score: correct, correctCount: correct },
          create: {
            id: `${user.id}-quiz-${q}`,
            studentId: user.id,
            quizId: seedQuiz.id,
            score: correct,
            totalQuestions: totalQ,
            correctCount: correct,
            timeSpent: 300 + Math.floor(Math.random() * 600),
            completedAt,
          },
        })
      }
    }

    // Telemetry for last 84 days
    const pageIds = ['quiz', 'tutor', 'notes', 'resources', 'leaderboard', 'planner', 'wellbeing']
    for (let day = 0; day < 84; day++) {
      const d = new Date(Date.now() - day * 86400000)
      d.setHours(0, 0, 0, 0)
      const activeMinutes = Math.floor(Math.random() * 180)
      if (activeMinutes < 5) continue
      const teleId = `${user.id}-tele-${day}`
      try {
        await db.telemetryRecord.create({
          data: {
            id: teleId,
            studentId: user.id,
            pageId: pageIds[Math.floor(Math.random() * pageIds.length)],
            activeSeconds: activeMinutes * 60,
            scrollPercentage: Math.random() * 100,
            interactionCount: Math.floor(Math.random() * 50),
            tabFocused: true,
            createdAt: d,
          },
        })
      } catch { /* duplicate — skip */ }
    }

    // Material progress
    const materials = await db.material.findMany({ take: 5 })
    for (const m of materials) {
      await db.materialProgress.upsert({
        where: { id: `${user.id}-mat-${m.id}` },
        update: { completionStatus: Math.random() > 0.4 ? 'done' : 'in_progress' },
        create: {
          id: `${user.id}-mat-${m.id}`,
          studentId: user.id,
          materialId: m.id,
          completionStatus: Math.random() > 0.4 ? 'done' : 'in_progress',
          timeSpent: Math.floor(Math.random() * 3600),
        },
      })
    }
  }

  // Also create StudentProgress for the current logged-in user if not in the list
  // (This ensures the logged-in user has data if they aren't in the seed list)
  const allUsers = await db.user.findMany({ where: { role: 'student' } })
  for (const u of allUsers) {
    const exists = await db.studentProgress.findUnique({ where: { studentId: u.id } })
    if (!exists) {
      const baseXp = Math.floor(Math.random() * 3000) + 500
      const level = findLevel(baseXp)
      await db.studentProgress.create({ data: { studentId: u.id, xp: baseXp, level } })
      await db.streak.upsert({
        where: { studentId: u.id },
        update: {},
        create: { studentId: u.id, currentStreak: 0, longestStreak: 0, totalActiveDays: 0 },
      })
      console.log(`  Created progress for existing user: ${u.name || u.email}`)
    }
  }

  // Assign randomized previousRank to all students so everyone shows a change
  const allProgress = await db.studentProgress.findMany({ orderBy: { xp: 'desc' } })
  const total = allProgress.length
  const shuffledRanks = Array.from({ length: total }, (_, i) => i + 1)
  // Fisher-Yates shuffle — re-shuffle until no one gets their own rank
  let collision = true
  while (collision) {
    for (let i = shuffledRanks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledRanks[i], shuffledRanks[j]] = [shuffledRanks[j], shuffledRanks[i]]
    }
    collision = shuffledRanks.some((rank, i) => rank === i + 1)
  }
  for (let i = 0; i < total; i++) {
    await db.studentProgress.update({
      where: { studentId: allProgress[i].studentId },
      data: { previousRank: shuffledRanks[i] },
    })
  }
  console.log(`  Assigned previousRank to ${total} students`)

  console.log('\nLeaderboard seeded successfully!')
  console.log(`  Total students with progress: ${total}`)
}

seedLeaderboard()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => {
    void db.$disconnect()
  })
