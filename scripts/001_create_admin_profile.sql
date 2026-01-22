-- Create profile for admin user if it doesn't exist
INSERT INTO public.profiles (id, email, role, full_name, is_active, created_at, updated_at)
VALUES (
  '49e00fd2-b5d1-434b-8e67-43ccaabec471',
  'admin_main@email.com',
  'admin_main',
  'Admin Principal',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin_main',
  email = 'admin_main@email.com',
  updated_at = NOW();
