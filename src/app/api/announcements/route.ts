import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { announcementCreateSchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.ANNOUNCEMENTS_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const priority = searchParams.get("priority") || ""

    const where: any = {}

    if (priority) {
      where.priority = priority
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.announcement.count({ where })
    ])

    return NextResponse.json({
      data: announcements,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error("Failed to fetch announcements:", error)
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

    if (!hasPermission(session.user, PERMISSIONS.ANNOUNCEMENTS_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only UKNF users can create announcements
    if (!session.user.isInternal) {
      return NextResponse.json({ error: "Only UKNF users can create announcements" }, { status: 403 })
    }

    const body = await request.json()
    const data = announcementCreateSchema.parse(body)

    const announcement = await prisma.announcement.create({
      data
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.ANNOUNCEMENT_CREATE,
      entity: AUDIT_ENTITIES.ANNOUNCEMENT,
      entityId: announcement.id,
      after: announcement
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error("Failed to create announcement:", error)
    
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
