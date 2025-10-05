import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { reportCreateSchema, reportFiltersSchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"
import { storage } from "@/lib/storage"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.REPORTS_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters = reportFiltersSchema.parse({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
      status: searchParams.get("status") || undefined,
      period: searchParams.get("period") || undefined,
      subjectId: searchParams.get("subjectId") ? parseInt(searchParams.get("subjectId")!) : undefined,
      register: searchParams.get("register") || undefined
    })

    const where: any = {}
    
    // Filter by status
    if (filters.status) {
      where.status = filters.status
    }
    
    // Filter by period
    if (filters.period) {
      where.period = filters.period
    }
    
    // Filter by subject
    if (filters.subjectId) {
      where.subjectId = filters.subjectId
    }
    
    // Filter by register
    if (filters.register) {
      where.register = filters.register
    }

    // External users can only see their own subject's reports
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

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          validations: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: {
          [filters.sortBy as string]: filters.sortOrder
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.report.count({ where })
    ])

    return NextResponse.json({
      data: reports,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize)
      }
    })
  } catch (error) {
    console.error("Failed to fetch reports:", error)
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

    if (!hasPermission(session.user, PERMISSIONS.REPORTS_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = reportCreateSchema.parse(body)

    // Check if user has access to the subject
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

    const report = await prisma.report.create({
      data: {
        subjectId: data.subjectId,
        period: data.period,
        register: data.register,
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
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

    // Initialize storage if needed
    await storage.initialize()
    
    // Generate presigned URL for file upload
    const filePath = `reports/${report.id}/${data.filename}`
    const presignedData = await storage.getPresignedPostUrl(filePath)

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.REPORT_CREATE,
      entity: AUDIT_ENTITIES.REPORT,
      entityId: report.id,
      after: report
    })

    return NextResponse.json({
      id: report.id,
      upload: {
        url: presignedData.url,
        fields: presignedData.fields
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create report:", error)
    
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
