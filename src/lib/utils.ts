import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isAllowedFileType(filename: string): boolean {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'mp3', 'zip'
  ]
  const extension = getFileExtension(filename)
  return allowedTypes.includes(extension)
}

export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const extension = getFileExtension(originalName)
  return `${timestamp}_${random}.${extension}`
}

export function maskPesel(pesel: string): string {
  if (!pesel || pesel.length !== 11) return pesel
  return "*******" + pesel.slice(-4)
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return email
  return local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] + '@' + domain
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function validateNip(nip: string): boolean {
  const nipRegex = /^\d{10}$/
  if (!nipRegex.test(nip)) return false
  
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  const digits = nip.split('').map(Number)
  const checkDigit = digits[9]
  
  const sum = digits.slice(0, 9).reduce((acc, digit, index) => {
    return acc + digit * weights[index]
  }, 0)
  
  return (sum % 11) === checkDigit
}

export function validateKrs(krs: string): boolean {
  const krsRegex = /^\d{10}$/
  return krsRegex.test(krs)
}

export function validateLei(lei: string): boolean {
  const leiRegex = /^[A-Z0-9]{20}$/
  return leiRegex.test(lei)
}
