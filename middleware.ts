import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Demo mode: Skip auth checks if credentials are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Demo mode - bypassing auth middleware")
    // Allow access to dashboard/admin in demo mode
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const clearAuthAndRedirect = (redirectToLogin = false) => {
    const authCookies = request.cookies
      .getAll()
      .filter((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("supabase"))

    authCookies.forEach((cookie) => {
      supabaseResponse.cookies.delete(cookie.name)
    })

    if (redirectToLogin) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
    return supabaseResponse
  }

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // Token is invalid or expired - clear cookies silently
      if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")) {
        return clearAuthAndRedirect(true)
      }
      return clearAuthAndRedirect(false)
    }
    user = data.user
  } catch (error) {
    // Any auth error - clear cookies and redirect if on protected route
    if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")) {
      return clearAuthAndRedirect(true)
    }
    return clearAuthAndRedirect(false)
  }

  const getUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
      return profile?.role || null
    } catch {
      return null
    }
  }

  // Redirect authenticated users from root to appropriate dashboard
  if (request.nextUrl.pathname === "/" && user) {
    const userRole = await getUserRole(user.id)

    if (userRole === "admin_main" || userRole === "admin" || userRole === "holding_admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard/meus-cadernos", request.url))
    }
  }

  // Block admins and gestors from accessing /dashboard routes (they use /admin)
  if (request.nextUrl.pathname.startsWith("/dashboard") && user) {
    const userRole = await getUserRole(user.id)

    if (userRole === "admin_main" || userRole === "admin" || userRole === "holding_admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return supabaseResponse
  }

  // Protect dashboard routes - require authentication
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Protect admin routes - require authentication
  if (request.nextUrl.pathname.startsWith("/admin") && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Redirect /holding to /dashboard
  if (request.nextUrl.pathname.startsWith("/holding")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect authenticated users away from login/signup
  if (
    (request.nextUrl.pathname.startsWith("/auth/login") || request.nextUrl.pathname.startsWith("/auth/signup")) &&
    user
  ) {
    const userRole = await getUserRole(user.id)

    if (userRole === "admin_main" || userRole === "admin" || userRole === "holding_admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard/meus-cadernos", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
