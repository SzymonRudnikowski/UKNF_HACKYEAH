import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { reportDisputeSchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"

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

    if (!hasPermission(session.user, PERMISSIONS.REPORTS_DISPUTE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = reportDisputeSchema.parse(body)

    const report = await prisma.report.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Only UKNF users can dispute reports
    if (!session.user.isInternal) {
      return NextResponse.json({ error: "Only UKNF users can dispute reports" }, { status: 403 })
    }

    // Only allow disputing reports with validation errors
    if (report.status !== "VALIDATION_ERRORS") {
      return NextResponse.json(
        { error: "Only reports with validation errors can be disputed" },
        { status: 400 }
      )
    }

    // Update report status to DISPUTED_BY_UKNF
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: "DISPUTED_BY_UKNF"
      }
    })

    // Create a message thread for the dispute
    const messageThread = await prisma.messageThread.create({
      data: {
        subject: `Disputa sprawozdania ${report.originalName}`,
        subjectId: report.subjectId,
        status: "WAITING_FOR_USER",
        priority: "HIGH"
      }
    })

    // Add initial message explaining the dispute
    await prisma.message.create({
      data: {
        threadId: messageThread.id,
        userId: session.user.id,
        content: `Sprawozdanie zostało zakwestionowane przez UKNF.\n\nPowód: ${data.reason}\n\nProsimy o kontakt w celu wyjaśnienia zaistniałych nieprawidłowości.`,
        isInternal: true
      }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.REPORT_DISPUTE,
      entity: AUDIT_ENTITIES.REPORT,
      entityId: id,
      after: updatedReport
    })

    return NextResponse.json({
      success: true,
      message: "Report disputed successfully",
      messageThreadId: messageThread.id
    })
  } catch (error) {
    console.error("Failed to dispute report:", error)
    
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
