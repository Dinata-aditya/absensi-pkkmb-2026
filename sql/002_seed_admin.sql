-- ===================================
-- SEED ADMIN ACCOUNT
-- Create first admin user
-- ===================================

-- IMPORTANT: This admin account should be created manually via Supabase Auth UI
-- or by registering through the application, then manually updating the role.

-- This SQL is for reference only. To create the first admin:

-- METHOD 1: Via Supabase Dashboard (RECOMMENDED)
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: admin@ac.id
-- 4. Password: AdminPKKMB2026!
-- 5. Enable "Auto Confirm User"
-- 6. Click "Create user"
-- 7. Copy the user ID
-- 8. Run the SQL below, replacing <USER_ID> with the actual UUID

-- METHOD 2: Register via Application
-- 1. Use the registration page to create account with admin@ac.id
-- 2. Get the user_id from Supabase Dashboard → Authentication → Users
-- 3. Run the SQL below to set role to ADMIN

-- ===================================
-- SET USER ROLE TO ADMIN
-- ===================================
-- Replace <USER_ID> with actual UUID from auth.users

-- Example (uncomment and replace USER_ID):
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('<USER_ID>', 'ADMIN')
-- ON CONFLICT (user_id) 
-- DO UPDATE SET role = 'ADMIN';

-- ===================================
-- VERIFICATION QUERY
-- ===================================
-- After creating admin, verify with:
-- SELECT 
--     u.id,
--     u.email,
--     ur.role,
--     u.created_at
-- FROM auth.users u
-- LEFT JOIN user_roles ur ON u.id = ur.user_id
-- WHERE u.email = 'admin@ac.id';

-- ===================================
-- NOTES
-- ===================================
-- Default admin credentials (for documentation):
-- Email: admin@ac.id
-- Password: AdminPKKMB2026!
-- 
-- ⚠️ SECURITY: Change this password immediately after first login!
-- ⚠️ Do NOT commit this file with actual credentials to public repos
