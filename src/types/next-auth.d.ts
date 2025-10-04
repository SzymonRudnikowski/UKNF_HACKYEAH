import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    isInternal?: boolean
    roles?: string[]
    permissions?: string[]
  }

  interface Session {
    user: User
  }
}
