import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { subjectCreateSchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.SUBJECTS_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""

    const where: any = {}

    // Search by name, NIP, KRS, or LEI
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nip: { contains: search } },
        { krs: { contains: search } },
        { lei: { contains: search } }
      ]
    }

    // Filter by type
    if (type) {
      where.type = type
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    // External users can only see subjects they have access to
    if (!session.user.isInternal) {
      const userSubjects = await prisma.accessRequest.findMany({
        where: {
          userId: session.user.id,
          status: "APPROVED"
        },
        select: { subjectId: true }
      })
      
      where.id = {
        in: userSubjects.map((ar: any) => ar.subjectId)
      }
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.subject.count({ where })
    ])

    return NextResponse.json({
      data: subjects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error("Failed to fetch subjects:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await withRateLimit()(request)
    if (rateLimitResponse) return rateLimitResponse

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.SUBJECTS_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = subjectCreateSchema.parse(body)

    // Check for duplicates
    const existingSubject = await prisma.subject.findFirst({
      where: {
        OR: [
          { nip: data.nip },
          { krs: data.krs },
          { lei: data.lei }
        ].filter(Boolean)
      }
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: "Subject with this NIP, KRS, or LEI already exists" },
        { status: 400 }
      )
    }

    const subject = await prisma.subject.create({
      data
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.SUBJECT_CREATE,
      entity: AUDIT_ENTITIES.SUBJECT,
      entityId: subject.id.toString(),
      after: subject
    })

    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error("Failed to create subject:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
