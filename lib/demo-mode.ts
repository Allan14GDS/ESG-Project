// Demo mode for v0 preview when Supabase authentication isn't available
export const isDemoMode = () => {
  // Check if we're in v0 preview or if Supabase credentials are missing
  const isV0Preview = typeof window !== 'undefined' && window.location.hostname.includes('v0.dev')
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  return isV0Preview || !hasSupabaseConfig
}

export const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  full_name: 'Usuário Demo',
  role: 'user' as const,
  is_active: true,
  organization_id: 'demo-org-id'
}

export const DEMO_ADMIN = {
  id: 'demo-admin-id',
  email: 'admin@example.com',
  full_name: 'Admin Demo',
  role: 'admin_main' as const,
  is_active: true,
  organization_id: 'demo-org-id'
}
