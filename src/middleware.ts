import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/sign-in", "/sign-up", "/api-docs"]
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // API routes - check authentication (except NextAuth and test routes)
  if (pathname.startsWith("/api/") && 
      !pathname.startsWith("/api/auth/") && 
      !pathname.startsWith("/api/test-")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Admin routes - require UKNF_ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!(session?.user?.roles as string[])?.includes("UKNF_ADMIN")) {
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }
    return NextResponse.next()
  }

  // Dashboard and communication routes - require authentication
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/communication")) {
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/communication/:path*",
    "/admin/:path*",
    "/api/:path*"
  ]
}
