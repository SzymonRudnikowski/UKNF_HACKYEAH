import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { reportSubmitSchema } from "@/lib/validations"
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

    if (!hasPermission(session.user, PERMISSIONS.REPORTS_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = reportSubmitSchema.parse(body)

    const report = await prisma.report.findUnique({
      where: { id: id },
      include: {
        subject: true
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

    // Only allow submission of DRAFT reports
    if (report.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft reports can be submitted" },
        { status: 400 }
      )
    }

    // Update report status to SUBMITTED
    const updatedReport = await prisma.report.update({
      where: { id: id },
      data: {
        status: "SUBMITTED"
      }
    })

    // Create validation record
    const validation = await prisma.reportValidation.create({
      data: {
        reportId: id,
        status: "PENDING"
      }
    })

    // In a real implementation, this would trigger an async validation process
    // For demo purposes, we'll simulate validation after a delay
    setTimeout(async () => {
      try {
        // Simulate validation process
        const validationResult = Math.random() > 0.3 ? "SUCCESS" : "VALIDATION_ERRORS"
        const errors = validationResult === "VALIDATION_ERRORS" ? 
          JSON.stringify([
            { field: "A1", message: "Błąd walidacji w komórce A1" },
            { field: "B5", message: "Nieprawidłowa wartość w komórce B5" }
          ]) : null

        await prisma.reportValidation.update({
          where: { id: validation.id },
          data: {
            status: "COMPLETED",
            result: validationResult,
            errors,
            completedAt: new Date()
          }
        })

        await prisma.report.update({
          where: { id: id },
          data: {
            status: validationResult === "SUCCESS" ? "SUCCESS" : "VALIDATION_ERRORS"
          }
        })
      } catch (error) {
        console.error("Validation simulation failed:", error)
        
        // Mark as tech error
        await prisma.reportValidation.update({
          where: { id: validation.id },
          data: {
            status: "FAILED",
            result: "TECH_ERROR",
            completedAt: new Date()
          }
        })

        await prisma.report.update({
          where: { id: id },
          data: {
            status: "TECH_ERROR"
          }
        })
      }
    }, 5000) // 5 second delay for demo

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.REPORT_SUBMIT,
      entity: AUDIT_ENTITIES.REPORT,
      entityId: id,
      after: updatedReport
    })

    return NextResponse.json({
      success: true,
      message: "Report submitted for validation",
      validationId: validation.id
    })
  } catch (error) {
    console.error("Failed to submit report:", error)
    
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
