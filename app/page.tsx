import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    const userRole = profile?.role

    // Redirect admins to admin panel, regular users to dashboard
    if (userRole === "admin_main" || userRole === "admin") {
      redirect("/admin")
    } else {
      redirect("/dashboard/meus-cadernos")
    }
  }

  // If not authenticated, redirect to login
  redirect("/auth/login")
}
