import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { messageReplySchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.MESSAGES_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id },
      include: {
        subjectEntity: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                isInternal: true
              }
            },
            attachments: true
          },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!thread) {
      return NextResponse.json({ error: "Message thread not found" }, { status: 404 })
    }

    // Check access for external users
    if (!session.user.isInternal) {
      if (thread.subjectId) {
        const hasAccess = await prisma.accessRequest.findFirst({
          where: {
            userId: session.user.id,
            subjectId: thread.subjectId,
            status: "APPROVED"
          }
        })

        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      }
    }

    return NextResponse.json(thread)
  } catch (error) {
    console.error("Failed to fetch message thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const data = messageReplySchema.parse(body)

    const thread = await prisma.messageThread.findUnique({
      where: { id }
    })

    if (!thread) {
      return NextResponse.json({ error: "Message thread not found" }, { status: 404 })
    }

    // Check access for external users
    if (!session.user.isInternal) {
      if (thread.subjectId) {
        const hasAccess = await prisma.accessRequest.findFirst({
          where: {
            userId: session.user.id,
            subjectId: thread.subjectId,
            status: "APPROVED"
          }
        })

        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      }
    }

    // Check if thread is closed
    if (thread.status === "CLOSED") {
      return NextResponse.json(
        { error: "Cannot reply to closed thread" },
        { status: 400 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        threadId: id,
        userId: session.user.id,
        content: data.content,
        isInternal: data.isInternal
      }
    })

    // Update thread status based on who replied
    const newStatus = session.user.isInternal ? "WAITING_FOR_USER" : "WAITING_FOR_UKNF"
    await prisma.messageThread.update({
      where: { id },
      data: { status: newStatus }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.MESSAGE_CREATE,
      entity: AUDIT_ENTITIES.MESSAGE,
      entityId: message.id,
      after: message
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Failed to create message:", error)
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.MESSAGES_EDIT)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    const thread = await prisma.messageThread.findUnique({
      where: { id }
    })

    if (!thread) {
      return NextResponse.json({ error: "Message thread not found" }, { status: 404 })
    }

    // Only UKNF users can change thread status
    if (!session.user.isInternal) {
      return NextResponse.json({ error: "Only UKNF users can change thread status" }, { status: 403 })
    }

    const updatedThread = await prisma.messageThread.update({
      where: { id },
      data: { status }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.MESSAGE_UPDATE,
      entity: AUDIT_ENTITIES.MESSAGE,
      entityId: id,
      before: thread,
      after: updatedThread
    })

    return NextResponse.json(updatedThread)
  } catch (error) {
    console.error("Failed to update message thread:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
