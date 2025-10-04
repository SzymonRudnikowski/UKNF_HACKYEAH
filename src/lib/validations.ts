import { z } from "zod"

// User validation schemas
export const userCreateSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki"),
  pesel: z.string().regex(/^\d{11}$/, "PESEL musi mieć 11 cyfr"),
  phone: z.string().optional(),
  isInternal: z.boolean().default(false)
})

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true })

export const userLoginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane")
})

// Subject validation schemas
export const subjectCreateSchema = z.object({
  type: z.string().optional(),
  uknfCode: z.string().optional(),
  name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki"),
  lei: z.string().optional(),
  nip: z.string().regex(/^\d{10}$/, "NIP musi mieć 10 cyfr").optional(),
  krs: z.string().regex(/^\d{10}$/, "KRS musi mieć 10 cyfr").optional(),
  street: z.string().optional(),
  buildingNo: z.string().optional(),
  unitNo: z.string().optional(),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, "Kod pocztowy musi być w formacie XX-XXX").optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Nieprawidłowy adres email").optional(),
  registryEntryNo: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  sector: z.string().optional(),
  subsector: z.string().optional(),
  isCrossBorder: z.boolean().default(false)
})

export const subjectUpdateSchema = subjectCreateSchema.partial()

// Report validation schemas
export const reportCreateSchema = z.object({
  subjectId: z.number().int().positive("ID podmiotu jest wymagane"),
  period: z.string().min(1, "Okres sprawozdawczy jest wymagany"),
  register: z.string().min(1, "Rejestr jest wymagany"),
  filename: z.string().min(1, "Nazwa pliku jest wymagana"),
  originalName: z.string().min(1, "Oryginalna nazwa pliku jest wymagana"),
  mimeType: z.string().min(1, "Typ MIME jest wymagany"),
  size: z.number().int().positive("Rozmiar pliku musi być dodatni")
})

export const reportUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "PROCESSING", "SUCCESS", "VALIDATION_ERRORS", "TECH_ERROR", "TIMEOUT", "DISPUTED_BY_UKNF"]).optional(),
  correctedReportId: z.string().optional()
})

export const reportSubmitSchema = z.object({
  reportId: z.string().min(1, "ID sprawozdania jest wymagane")
})

export const reportDisputeSchema = z.object({
  reportId: z.string().min(1, "ID sprawozdania jest wymagane"),
  reason: z.string().min(10, "Powód kwestionowania musi mieć co najmniej 10 znaków")
})

// Message validation schemas
export const messageCreateSchema = z.object({
  subject: z.string().min(5, "Temat musi mieć co najmniej 5 znaków"),
  content: z.string().min(10, "Treść musi mieć co najmniej 10 znaków"),
  subjectId: z.number().int().positive().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  accessRequestId: z.string().optional()
})

export const messageReplySchema = z.object({
  content: z.string().min(10, "Treść musi mieć co najmniej 10 znaków"),
  isInternal: z.boolean().default(false)
})

export const messageBulkSchema = z.object({
  subject: z.string().min(5, "Temat musi mieć co najmniej 5 znaków"),
  content: z.string().min(10, "Treść musi mieć co najmniej 10 znaków"),
  recipientRules: z.array(z.object({
    type: z.enum(["SUBJECT_TYPES", "SUBJECTS", "USERS", "GROUPS"]),
    criteria: z.record(z.any())
  })).min(1, "Musi być co najmniej jedna reguła odbiorców")
})

// Case validation schemas
export const caseCreateSchema = z.object({
  subjectId: z.number().int().positive("ID podmiotu jest wymagane"),
  title: z.string().min(5, "Tytuł musi mieć co najmniej 5 znaków"),
  description: z.string().optional(),
  category: z.string().min(1, "Kategoria jest wymagana"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM")
})

export const caseUpdateSchema = z.object({
  title: z.string().min(5, "Tytuł musi mieć co najmniej 5 znaków").optional(),
  description: z.string().optional(),
  category: z.string().min(1, "Kategoria jest wymagana").optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["DRAFT", "NEW", "IN_PROGRESS", "NEED_INFO", "DONE", "CANCELLED"]).optional()
})

// Announcement validation schemas
export const announcementCreateSchema = z.object({
  title: z.string().min(5, "Tytuł musi mieć co najmniej 5 znaków"),
  content: z.string().min(10, "Treść musi mieć co najmniej 10 znaków"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  isRequired: z.boolean().default(false),
  audience: z.string().optional() // JSON string with recipient rules
})

export const announcementUpdateSchema = announcementCreateSchema.partial()

// Library file validation schemas
export const libraryFileCreateSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  description: z.string().optional(),
  category: z.string().optional(),
  period: z.string().optional(),
  updateDate: z.string().datetime().optional(),
  isPublic: z.boolean().default(false)
})

export const libraryFileUpdateSchema = libraryFileCreateSchema.partial()

// FAQ validation schemas
export const faqQuestionCreateSchema = z.object({
  title: z.string().min(5, "Tytuł musi mieć co najmniej 5 znaków"),
  content: z.string().min(10, "Treść musi mieć co najmniej 10 znaków"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export const faqAnswerCreateSchema = z.object({
  questionId: z.string().min(1, "ID pytania jest wymagane"),
  content: z.string().min(10, "Treść musi mieć co najmniej 10 znaków"),
  isOfficial: z.boolean().default(false)
})

export const faqVoteSchema = z.object({
  questionId: z.string().min(1, "ID pytania jest wymagane"),
  rating: z.number().int().min(1).max(5, "Ocena musi być między 1 a 5")
})

// Contact validation schemas
export const contactCreateSchema = z.object({
  subjectId: z.number().int().positive().optional(),
  firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki"),
  email: z.string().email("Nieprawidłowy adres email").optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  isUser: z.boolean().default(false),
  userId: z.string().optional()
})

export const contactUpdateSchema = contactCreateSchema.partial()

export const contactGroupCreateSchema = z.object({
  name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki"),
  description: z.string().optional()
})

export const contactGroupUpdateSchema = contactGroupCreateSchema.partial()

// Access request validation schemas
export const accessRequestCreateSchema = z.object({
  subjectId: z.number().int().positive("ID podmiotu jest wymagane"),
  description: z.string().optional(),
  lines: z.array(z.object({
    permission: z.string().min(1, "Uprawnienie jest wymagane")
  })).min(1, "Musi być co najmniej jedno uprawnienie")
})

export const accessRequestUpdateSchema = z.object({
  description: z.string().optional(),
  lines: z.array(z.object({
    permission: z.string().min(1, "Uprawnienie jest wymagane")
  })).optional(),
  status: z.enum(["DRAFT", "NEW", "APPROVED", "BLOCKED", "UPDATED"]).optional()
})

// File upload validation schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Nazwa pliku jest wymagana"),
  mimeType: z.string().min(1, "Typ MIME jest wymagany"),
  size: z.number().int().positive("Rozmiar pliku musi być dodatni"),
  originalName: z.string().min(1, "Oryginalna nazwa pliku jest wymagana")
})

// Pagination and filtering schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

export const reportFiltersSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "PROCESSING", "SUCCESS", "VALIDATION_ERRORS", "TECH_ERROR", "TIMEOUT", "DISPUTED_BY_UKNF"]).optional(),
  period: z.string().optional(),
  subjectId: z.number().int().positive().optional(),
  register: z.string().optional()
}).merge(paginationSchema)

export const messageFiltersSchema = z.object({
  status: z.enum(["WAITING_FOR_UKNF", "WAITING_FOR_USER", "CLOSED"]).optional(),
  subjectId: z.number().int().positive().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional()
}).merge(paginationSchema)

export const caseFiltersSchema = z.object({
  status: z.enum(["DRAFT", "NEW", "IN_PROGRESS", "NEED_INFO", "DONE", "CANCELLED"]).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  subjectId: z.number().int().positive().optional()
}).merge(paginationSchema)

// Type exports
export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>
export type SubjectUpdateInput = z.infer<typeof subjectUpdateSchema>
export type ReportCreateInput = z.infer<typeof reportCreateSchema>
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>
export type MessageCreateInput = z.infer<typeof messageCreateSchema>
export type MessageReplyInput = z.infer<typeof messageReplySchema>
export type CaseCreateInput = z.infer<typeof caseCreateSchema>
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>
export type LibraryFileCreateInput = z.infer<typeof libraryFileCreateSchema>
export type FaqQuestionCreateInput = z.infer<typeof faqQuestionCreateSchema>
export type ContactCreateInput = z.infer<typeof contactCreateSchema>
export type AccessRequestCreateInput = z.infer<typeof accessRequestCreateSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type ReportFilters = z.infer<typeof reportFiltersSchema>
export type MessageFilters = z.infer<typeof messageFiltersSchema>
export type CaseFilters = z.infer<typeof caseFiltersSchema>
