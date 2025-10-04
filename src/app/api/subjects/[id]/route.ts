import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { subjectUpdateSchema } from "@/lib/validations"
import { hasPermission, PERMISSIONS } from "@/lib/rbac"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"

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

    if (!hasPermission(session.user, PERMISSIONS.SUBJECTS_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(id) }
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check access for external users
    if (!session.user.isInternal) {
      const hasAccess = await prisma.accessRequest.findFirst({
        where: {
          userId: session.user.id,
          subjectId: subject.id,
          status: "APPROVED"
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    return NextResponse.json(subject)
  } catch (error) {
    console.error("Failed to fetch subject:", error)
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

    if (!hasPermission(session.user, PERMISSIONS.SUBJECTS_EDIT)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const data = subjectUpdateSchema.parse(body)

    const existingSubject = await prisma.subject.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check access for external users
    if (!session.user.isInternal) {
      const hasAccess = await prisma.accessRequest.findFirst({
        where: {
          userId: session.user.id,
          subjectId: existingSubject.id,
          status: "APPROVED"
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Check for duplicates on unique fields
    if (data.nip || data.krs || data.lei) {
      const duplicateSubject = await prisma.subject.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            {
              OR: [
                data.nip ? { nip: data.nip } : {},
                data.krs ? { krs: data.krs } : {},
                data.lei ? { lei: data.lei } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          ]
        }
      })

      if (duplicateSubject) {
        return NextResponse.json(
          { error: "Subject with this NIP, KRS, or LEI already exists" },
          { status: 400 }
        )
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.SUBJECT_UPDATE,
      entity: AUDIT_ENTITIES.SUBJECT,
      entityId: id,
      before: existingSubject,
      after: updatedSubject
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error("Failed to update subject:", error)
    
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

    if (!hasPermission(session.user, PERMISSIONS.SUBJECTS_DELETE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only UKNF users can delete subjects
    if (!session.user.isInternal) {
      return NextResponse.json({ error: "Only UKNF users can delete subjects" }, { status: 403 })
    }

    const existingSubject = await prisma.subject.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if subject has related data
    const relatedData = await Promise.all([
      prisma.report.count({ where: { subjectId: parseInt(id) } }),
      prisma.messageThread.count({ where: { subjectId: parseInt(id) } }),
      prisma.case.count({ where: { subjectId: parseInt(id) } }),
      prisma.accessRequest.count({ where: { subjectId: parseInt(id) } })
    ])

    const totalRelated = relatedData.reduce((sum, count) => sum + count, 0)
    if (totalRelated > 0) {
      return NextResponse.json(
        { error: "Cannot delete subject with related data" },
        { status: 400 }
      )
    }

    await prisma.subject.delete({
      where: { id: parseInt(id) }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.SUBJECT_DELETE,
      entity: AUDIT_ENTITIES.SUBJECT,
      entityId: id,
      before: existingSubject
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete subject:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
