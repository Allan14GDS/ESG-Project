import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function LogoutPage() {
  async function logout() {
    "use server"

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  await logout()

  return null
}
