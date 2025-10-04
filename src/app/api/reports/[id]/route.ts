import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { reportUpdateSchema, reportSubmitSchema, reportDisputeSchema } from "@/lib/validations"
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

    if (!hasPermission(session.user, PERMISSIONS.REPORTS_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const report = await prisma.report.findUnique({
      where: { id: id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            type: true,
            uknfCode: true
          }
        },
        validations: {
          orderBy: { createdAt: "desc" }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check access for external users
    if (!session.user.isInternal) {
      const hasAccess = await prisma.accessRequest.findFirst({
        where: {
          userId: session.user.id,
          subjectId: report.subjectId,
          status: "APPROVED"
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Failed to fetch report:", error)
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

    if (!hasPermission(session.user, PERMISSIONS.REPORTS_EDIT)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = reportUpdateSchema.parse(body)

    const existingReport = await prisma.report.findUnique({
      where: { id: id }
    })

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check access for external users
    if (!session.user.isInternal) {
      const hasAccess = await prisma.accessRequest.findFirst({
        where: {
          userId: session.user.id,
          subjectId: existingReport.subjectId,
          status: "APPROVED"
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id: id },
      data,
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
      action: AUDIT_ACTIONS.REPORT_UPDATE,
      entity: AUDIT_ENTITIES.REPORT,
      entityId: id,
      before: existingReport,
      after: updatedReport
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Failed to update report:", error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user, PERMISSIONS.REPORTS_DELETE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const existingReport = await prisma.report.findUnique({
      where: { id: id }
    })

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check access for external users
    if (!session.user.isInternal) {
      const hasAccess = await prisma.accessRequest.findFirst({
        where: {
          userId: session.user.id,
          subjectId: existingReport.subjectId,
          status: "APPROVED"
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Only allow deletion of DRAFT reports
    if (existingReport.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft reports can be deleted" },
        { status: 400 }
      )
    }

    await prisma.report.delete({
      where: { id: id }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.REPORT_DELETE,
      entity: AUDIT_ENTITIES.REPORT,
      entityId: id,
      before: existingReport
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
