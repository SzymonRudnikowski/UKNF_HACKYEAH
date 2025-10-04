import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hash } from "bcryptjs"
import { userCreateSchema } from "@/lib/validations"
import { audit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit"
import { withRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await withRateLimit()(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const data = userCreateSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Użytkownik z tym adresem email już istnieje" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        peselMasked: data.pesel ? data.pesel.slice(-4) : null,
        phone: data.phone,
        isInternal: false, // External user registration
        isActive: true
      }
    })

    // Create access request for external user
    // In a real system, this would require approval from UKNF
    const accessRequest = await prisma.accessRequest.create({
      data: {
        userId: user.id,
        subjectId: 1, // Default subject for demo
        status: "DRAFT",
        description: "Wniosek o dostęp do systemu",
        lines: {
          create: [
            { permission: "COMMUNICATION_VIEW" },
            { permission: "REPORTS_VIEW" },
            { permission: "MESSAGES_VIEW" },
            { permission: "CASES_VIEW" },
            { permission: "ANNOUNCEMENTS_VIEW" },
            { permission: "SUBJECTS_VIEW" },
            { permission: "FAQ_VIEW" }
          ]
        }
      }
    })

    // Audit log
    await audit({
      action: AUDIT_ACTIONS.USER_CREATE,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      after: user
    })

    return NextResponse.json({
      success: true,
      message: "Konto zostało utworzone. Możesz się teraz zalogować.",
      userId: user.id
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to register user:", error)
    
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
