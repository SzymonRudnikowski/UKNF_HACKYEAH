import { auth } from "@/lib/auth"

export interface User {
  id: string
  email: string
  roles?: string[]
  permissions?: string[]
  isInternal?: boolean
  firstName?: string
  lastName?: string
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user || !user.permissions) return false
  return user.permissions.includes(permission)
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user || !user.roles) return false
  return user.roles.includes(role)
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user || !user.roles) return false
  return roles.some(role => user.roles!.includes(role))
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user || !user.permissions) return false
  return permissions.some(permission => user.permissions!.includes(permission))
}

export function isInternalUser(user: User | null): boolean {
  return user?.isInternal ?? false
}

export function isExternalUser(user: User | null): boolean {
  return user ? !user.isInternal : false
}

// Permission constants
export const PERMISSIONS = {
  // Communication module
  COMMUNICATION_VIEW: "COMMUNICATION_VIEW",
  COMMUNICATION_EDIT: "COMMUNICATION_EDIT",
  
  // Reports
  REPORTS_VIEW: "REPORTS_VIEW",
  REPORTS_CREATE: "REPORTS_CREATE",
  REPORTS_EDIT: "REPORTS_EDIT",
  REPORTS_DELETE: "REPORTS_DELETE",
  REPORTS_VALIDATE: "REPORTS_VALIDATE",
  REPORTS_DISPUTE: "REPORTS_DISPUTE",
  
  // Messages
  MESSAGES_VIEW: "MESSAGES_VIEW",
  MESSAGES_CREATE: "MESSAGES_CREATE",
  MESSAGES_EDIT: "MESSAGES_EDIT",
  MESSAGES_DELETE: "MESSAGES_DELETE",
  MESSAGES_BULK: "MESSAGES_BULK",
  
  // Cases
  CASES_VIEW: "CASES_VIEW",
  CASES_CREATE: "CASES_CREATE",
  CASES_EDIT: "CASES_EDIT",
  CASES_DELETE: "CASES_DELETE",
  CASES_CANCEL: "CASES_CANCEL",
  
  // Announcements
  ANNOUNCEMENTS_VIEW: "ANNOUNCEMENTS_VIEW",
  ANNOUNCEMENTS_CREATE: "ANNOUNCEMENTS_CREATE",
  ANNOUNCEMENTS_EDIT: "ANNOUNCEMENTS_EDIT",
  ANNOUNCEMENTS_DELETE: "ANNOUNCEMENTS_DELETE",
  ANNOUNCEMENTS_ACK: "ANNOUNCEMENTS_ACK",
  
  // Library
  LIBRARY_VIEW: "LIBRARY_VIEW",
  LIBRARY_CREATE: "LIBRARY_CREATE",
  LIBRARY_EDIT: "LIBRARY_EDIT",
  LIBRARY_DELETE: "LIBRARY_DELETE",
  LIBRARY_DOWNLOAD: "LIBRARY_DOWNLOAD",
  
  // Subjects
  SUBJECTS_VIEW: "SUBJECTS_VIEW",
  SUBJECTS_CREATE: "SUBJECTS_CREATE",
  SUBJECTS_EDIT: "SUBJECTS_EDIT",
  SUBJECTS_DELETE: "SUBJECTS_DELETE",
  
  // FAQ
  FAQ_VIEW: "FAQ_VIEW",
  FAQ_CREATE: "FAQ_CREATE",
  FAQ_EDIT: "FAQ_EDIT",
  FAQ_DELETE: "FAQ_DELETE",
  FAQ_ANSWER: "FAQ_ANSWER",
  FAQ_VOTE: "FAQ_VOTE",
  
  // Contacts
  CONTACTS_VIEW: "CONTACTS_VIEW",
  CONTACTS_CREATE: "CONTACTS_CREATE",
  CONTACTS_EDIT: "CONTACTS_EDIT",
  CONTACTS_DELETE: "CONTACTS_DELETE",
  
  // Access Requests
  ACCESS_REQUESTS_VIEW: "ACCESS_REQUESTS_VIEW",
  ACCESS_REQUESTS_CREATE: "ACCESS_REQUESTS_CREATE",
  ACCESS_REQUESTS_EDIT: "ACCESS_REQUESTS_EDIT",
  ACCESS_REQUESTS_APPROVE: "ACCESS_REQUESTS_APPROVE",
  ACCESS_REQUESTS_BLOCK: "ACCESS_REQUESTS_BLOCK",
  
  // Admin
  ADMIN_USERS: "ADMIN_USERS",
  ADMIN_ROLES: "ADMIN_ROLES",
  ADMIN_POLICIES: "ADMIN_POLICIES",
  ADMIN_AUDIT: "ADMIN_AUDIT",
  
  // System
  SYSTEM_CONFIG: "SYSTEM_CONFIG",
  SYSTEM_MAINTENANCE: "SYSTEM_MAINTENANCE"
} as const

// Role constants
export const ROLES = {
  UKNF_ADMIN: "UKNF_ADMIN",
  UKNF_WORKER: "UKNF_WORKER",
  SUBJECT_ADMIN: "SUBJECT_ADMIN",
  SUBJECT_EMPLOYEE: "SUBJECT_EMPLOYEE"
} as const

// Helper function to get current user from session
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  if (!session?.user) return null
  
  return {
    id: session.user.id,
    email: session.user.email || "",
    roles: session.user.roles || [],
    permissions: session.user.permissions || [],
    isInternal: session.user.isInternal || false,
    firstName: session.user.firstName || "",
    lastName: session.user.lastName || ""
  }
}
