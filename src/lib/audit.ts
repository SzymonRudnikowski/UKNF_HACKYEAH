import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/rbac"

export interface AuditContext {
  action: string
  entity: string
  entityId?: string
  before?: any
  after?: any
  ipAddress?: string
  userAgent?: string
}

export async function audit(context: AuditContext): Promise<void> {
  try {
    const user = await getCurrentUser()
    if (!user) return

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: context.action,
        entity: context.entity,
        entityId: context.entityId,
        before: context.before ? JSON.stringify(context.before) : null,
        after: context.after ? JSON.stringify(context.after) : null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logging should not break the main flow
  }
}

export async function auditWithRequest(
  context: Omit<AuditContext, 'ipAddress' | 'userAgent'>,
  request: Request
): Promise<void> {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  await audit({
    ...context,
    ipAddress,
    userAgent
  })
}

// Common audit actions
export const AUDIT_ACTIONS = {
  // User actions
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  USER_DEACTIVATE: "USER_DEACTIVATE",
  
  // Subject actions
  SUBJECT_CREATE: "SUBJECT_CREATE",
  SUBJECT_UPDATE: "SUBJECT_UPDATE",
  SUBJECT_DELETE: "SUBJECT_DELETE",
  
  // Report actions
  REPORT_CREATE: "REPORT_CREATE",
  REPORT_UPDATE: "REPORT_UPDATE",
  REPORT_DELETE: "REPORT_DELETE",
  REPORT_SUBMIT: "REPORT_SUBMIT",
  REPORT_VALIDATE: "REPORT_VALIDATE",
  REPORT_DISPUTE: "REPORT_DISPUTE",
  REPORT_ARCHIVE: "REPORT_ARCHIVE",
  
  // Message actions
  MESSAGE_CREATE: "MESSAGE_CREATE",
  MESSAGE_UPDATE: "MESSAGE_UPDATE",
  MESSAGE_DELETE: "MESSAGE_DELETE",
  MESSAGE_ATTACHMENT_UPLOAD: "MESSAGE_ATTACHMENT_UPLOAD",
  
  // Case actions
  CASE_CREATE: "CASE_CREATE",
  CASE_UPDATE: "CASE_UPDATE",
  CASE_DELETE: "CASE_DELETE",
  CASE_CANCEL: "CASE_CANCEL",
  
  // Announcement actions
  ANNOUNCEMENT_CREATE: "ANNOUNCEMENT_CREATE",
  ANNOUNCEMENT_UPDATE: "ANNOUNCEMENT_UPDATE",
  ANNOUNCEMENT_DELETE: "ANNOUNCEMENT_DELETE",
  ANNOUNCEMENT_ACK: "ANNOUNCEMENT_ACK",
  
  // Library actions
  LIBRARY_CREATE: "LIBRARY_CREATE",
  LIBRARY_UPDATE: "LIBRARY_UPDATE",
  LIBRARY_DELETE: "LIBRARY_DELETE",
  LIBRARY_DOWNLOAD: "LIBRARY_DOWNLOAD",
  
  // Access request actions
  ACCESS_REQUEST_CREATE: "ACCESS_REQUEST_CREATE",
  ACCESS_REQUEST_UPDATE: "ACCESS_REQUEST_UPDATE",
  ACCESS_REQUEST_APPROVE: "ACCESS_REQUEST_APPROVE",
  ACCESS_REQUEST_BLOCK: "ACCESS_REQUEST_BLOCK",
  
  // Admin actions
  ADMIN_USER_MANAGE: "ADMIN_USER_MANAGE",
  ADMIN_ROLE_MANAGE: "ADMIN_ROLE_MANAGE",
  ADMIN_POLICY_MANAGE: "ADMIN_POLICY_MANAGE",
  
  // System actions
  SYSTEM_CONFIG_UPDATE: "SYSTEM_CONFIG_UPDATE",
  SYSTEM_MAINTENANCE: "SYSTEM_MAINTENANCE"
} as const

// Common entities
export const AUDIT_ENTITIES = {
  USER: "USER",
  ROLE: "ROLE",
  PERMISSION: "PERMISSION",
  SUBJECT: "SUBJECT",
  REPORT: "REPORT",
  MESSAGE: "MESSAGE",
  CASE: "CASE",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  LIBRARY_FILE: "LIBRARY_FILE",
  ACCESS_REQUEST: "ACCESS_REQUEST",
  CONTACT: "CONTACT",
  FAQ_QUESTION: "FAQ_QUESTION",
  NOTIFICATION: "NOTIFICATION",
  SYSTEM: "SYSTEM"
} as const
