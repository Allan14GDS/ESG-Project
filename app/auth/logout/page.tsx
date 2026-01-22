import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function LogoutPage() {
  // Server action para fazer logout
  async function logout() {
    "use server"

    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  // Executar logout imediatamente quando a página carregar
  await logout()

  return null
}
