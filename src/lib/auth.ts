import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          })

          if (!user || !user.hashedPassword) {
            return null
          }

          const isValid = await compare(credentials.password as string, user.hashedPassword)
          
          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isInternal: user.isInternal,
            roles: user.roles.map((r: any) => r.role.name),
            permissions: user.roles.flatMap((r: any) => 
              r.role.permissions.map((p: any) => p.permission.code)
            )
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as any).roles
        token.permissions = (user as any).permissions
        token.isInternal = (user as any).isInternal
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.roles = (token as any).roles || []
        session.user.permissions = (token as any).permissions || []
        session.user.isInternal = (token as any).isInternal || false
        session.user.firstName = (token as any).firstName || ""
        session.user.lastName = (token as any).lastName || ""
      }
      return session
    }
  },
  pages: {
    signIn: "/sign-in"
  }
})
