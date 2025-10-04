import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { messageCreateSchema, messageBulkSchema, messageFiltersSchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.MESSAGES_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters = messageFiltersSchema.parse({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      sortBy: searchParams.get("sortBy") || "updatedAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
      status: searchParams.get("status") || undefined,
      subjectId: searchParams.get("subjectId") ? parseInt(searchParams.get("subjectId")!) : undefined,
      priority: searchParams.get("priority") || undefined
    })

    const where: any = {}
    
    // Filter by status
    if (filters.status) {
      where.status = filters.status
    }
    
    // Filter by priority
    if (filters.priority) {
      where.priority = filters.priority
    }
    
    // Filter by subject
    if (filters.subjectId) {
      where.subjectId = filters.subjectId
    }

    // External users can only see threads related to their subjects
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

    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        include: {
          subjectEntity: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  isInternal: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          [filters.sortBy as string]: filters.sortOrder
        },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.messageThread.count({ where })
    ])

    return NextResponse.json({
      data: threads,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize)
      }
    })
  } catch (error) {
    console.error("Failed to fetch message threads:", error)
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

    if (!hasPermission(session.user, PERMISSIONS.MESSAGES_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = messageCreateSchema.parse(body)

    // Check access to subject if specified
    if (data.subjectId && !session.user.isInternal) {
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

    // Create message thread
    const thread = await prisma.messageThread.create({
      data: {
        subject: data.subject,
        subjectId: data.subjectId,
        priority: data.priority,
        accessRequestId: data.accessRequestId,
        status: session.user.isInternal ? "WAITING_FOR_USER" : "WAITING_FOR_UKNF"
      }
    })

    // Create initial message
    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        userId: session.user.id,
        content: data.content,
        isInternal: session.user.isInternal
      }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.MESSAGE_CREATE,
      entity: AUDIT_ENTITIES.MESSAGE,
      entityId: message.id,
      after: { thread, message }
    })

    return NextResponse.json({
      threadId: thread.id,
      messageId: message.id
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create message thread:", error)
    
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
