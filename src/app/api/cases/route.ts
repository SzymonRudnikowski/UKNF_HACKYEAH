import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { caseCreateSchema, caseFiltersSchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.CASES_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters = caseFiltersSchema.parse({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      priority: searchParams.get("priority") || undefined,
      subjectId: searchParams.get("subjectId") ? parseInt(searchParams.get("subjectId")!) : undefined
    })

    const where: any = {}
    
    // Filter by status
    if (filters.status) {
      where.status = filters.status
    }
    
    // Filter by category
    if (filters.category) {
      where.category = filters.category
    }
    
    // Filter by priority
    if (filters.priority) {
      where.priority = filters.priority
    }
    
    // Filter by subject
    if (filters.subjectId) {
      where.subjectId = filters.subjectId
    }

    // External users can only see cases related to their subjects
    if (!session.user.isInternal) {
      const userSubjects = await prisma.accessRequest.findMany({
        where: {
          userId: session.user.id,
          status: "APPROVED"
        },
        select: { subjectId: true }
      })
      
      where.subjectId = {
        in: userSubjects.map((ar: any) => ar.subjectId)
      }
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          attachments: {
            select: {
              id: true,
              filename: true,
              size: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          [filters.sortBy as string]: filters.sortOrder
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.case.count({ where })
    ])

    return NextResponse.json({
      data: cases,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize)
      }
    })
  } catch (error) {
    console.error("Failed to fetch cases:", error)
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

    if (!hasPermission(session.user, PERMISSIONS.CASES_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = caseCreateSchema.parse(body)

    // Check access to subject
    if (!session.user.isInternal) {
      const hasAccess = await prisma.accessRequest.findFirst({
        where: {
          userId: session.user.id,
          subjectId: data.subjectId,
          status: "APPROVED"
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to subject" }, { status: 403 })
      }
    }

    const case_ = await prisma.case.create({
      data: {
        subjectId: data.subjectId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "DRAFT"
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.CASE_CREATE,
      entity: AUDIT_ENTITIES.CASE,
      entityId: case_.id,
      after: case_
    })

    return NextResponse.json(case_, { status: 201 })
  } catch (error) {
    console.error("Failed to create case:", error)
    
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
