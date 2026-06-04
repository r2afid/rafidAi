import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUserId } from '@/lib/api-utils'
import { getAIProvider } from '@/ai/providers'

const TASK_TYPE_HOURS: Record<string, number> = {
  exam: 12, project: 15, assignment: 6, quiz: 4, presentation: 8, lab_report: 6,
}

async function estimateHours(title: string, description: string | null, taskType: string): Promise<number> {
  try {
    const provider = getAIProvider('groq')
    const prompt = `Estimate how many study hours a student needs to complete this academic task.

Task Type: ${taskType}
Title: ${title}
${description ? `Description: ${description}` : ''}

Consider:
- The task type (exam, project, assignment, quiz, presentation, lab_report) and its typical workload
- Some projects can be simple (few hours) while others require deep work (many hours)
- The title and description indicate scope and difficulty
- Be realistic and specific — not every "${taskType}" takes the same time

Return ONLY a single integer number representing the estimated hours (minimum 1, maximum 60). No explanation, no unit, no formatting. Example: 8`

    const response = await provider.complete({
      messages: [
        { role: 'system', content: 'You estimate study hours for academic tasks. Return only a number.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      maxTokens: 10,
    })

    const parsed = parseInt(response?.trim() ?? '', 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 60) return parsed
  } catch {
    // AI failed, fall through to default
  }

  return TASK_TYPE_HOURS[taskType] ?? 6
}

export async function GET() {
  try {
    const userId = await resolveUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assignments = await db.assignment.findMany({
      where: { teacherId: userId },
      include: { course: { select: { id: true, name: true, code: true } } },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Teacher assignments GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, courseId, taskType, assignedDate, dueDate } = body

    if (!title || !courseId || !taskType || !dueDate) {
      return NextResponse.json({ error: 'title, courseId, taskType, and dueDate are required' }, { status: 400 })
    }

    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const estimatedHours = await estimateHours(title, description ?? null, taskType)

    const assignment = await db.assignment.create({
      data: {
        title,
        description: description ?? null,
        courseId,
        teacherId: userId,
        taskType,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        dueDate: new Date(dueDate),
        estimatedHours,
      },
      include: { course: { select: { id: true, name: true, code: true } } },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Teacher assignments POST error:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 })

    const assignment = await db.assignment.findUnique({ where: { id } })
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    if (assignment.teacherId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await db.assignment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Teacher assignments DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
