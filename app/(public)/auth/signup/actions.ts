"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function signUp(formData: FormData) {
  const fullName = formData.get("fullName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("[v0] Starting signup for:", email)

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  })

  if (authError) {
    console.error("[v0] Auth signup error:", authError)
    return { error: authError.message }
  }

  if (!authData.user) {
    console.error("[v0] No user returned from signup")
    return { error: "Failed to create user" }
  }

  console.log("[v0] User created in auth.users:", authData.user.id)

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    role: "responder",
    is_super_admin: false,
  })

  if (profileError) {
    console.error("[v0] Profile creation error:", profileError)
    return { error: "Failed to create user profile: " + profileError.message }
  }

  console.log("[v0] Profile created successfully")

  revalidatePath("/auth/login")
  redirect("/auth/login")
}
