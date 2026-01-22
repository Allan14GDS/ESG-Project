import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let adminClientInstance: SupabaseClient | null = null

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables for admin client")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getAdminClient(): SupabaseClient {
  if (!adminClientInstance) {
    adminClientInstance = createAdminClient()
  }
  return adminClientInstance
}

export const adminClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getAdminClient()
    const value = (client as any)[prop]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})
