# Supabase Auth Configuration

## Required Settings

### 1. Disable Email Confirmation (Recommended for Simplicity)

Untuk mempermudah mahasiswa registrasi tanpa harus konfirmasi email:

1. Buka Supabase Dashboard
2. Go to **Authentication** → **Settings**
3. Scroll ke section **"Email Auth"**
4. **DISABLE** option: **"Enable email confirmations"**
5. Click **"Save"**

Dengan setting ini:
- Mahasiswa bisa langsung login setelah registrasi
- Tidak perlu klik link konfirmasi di email
- Admin yang verifikasi via status PENDING → ACTIVE

### 2. Configure Site URL (Untuk Password Reset)

1. Buka **Authentication** → **URL Configuration**
2. Set **Site URL** ke domain aplikasi Anda:
   - Development: `http://localhost:8000`
   - Production: `https://absensi.ac.id` (atau domain Anda)
3. Set **Redirect URLs**:
   - Add: `http://localhost:8000/update-password.html`
   - Add: `https://absensi.ac.id/update-password.html`
4. Click **"Save"**

### 3. Email Templates (Optional)

Customize email templates untuk password reset:

1. Go to **Authentication** → **Email Templates**
2. Select **"Reset Password"**
3. Customize subject dan body sesuai kebutuhan
4. Pastikan link redirect ke `{{ .ConfirmationURL }}`

### 4. Rate Limiting (Important for Security)

Default Supabase rate limiting sudah cukup baik:
- 30 requests per hour untuk password reset
- Rate limiting per IP address

Jika perlu adjust:
1. Go to **Authentication** → **Settings**
2. Scroll ke **"Rate Limits"**
3. Adjust sesuai kebutuhan

### 5. Session Settings

Default settings sudah baik:
- **Session timeout:** 604800 seconds (7 days)
- **Refresh token rotation:** Enabled

Mahasiswa tidak perlu login ulang selama 7 hari.

## Testing

After configuration, test:

1. ✅ Register new account → Should login immediately without email confirmation
2. ✅ Login → Should remember session
3. ✅ Close browser → Open again → Should still be logged in
4. ✅ Forgot password → Should receive reset email
5. ✅ Reset password link → Should redirect correctly

## Security Checklist

- [x] Email confirmation disabled (simplified registration)
- [x] Site URL configured
- [x] Redirect URLs whitelisted
- [x] Rate limiting enabled
- [x] Session timeout appropriate (7 days)
- [x] RLS policies active on all tables

## Troubleshooting

### Email not received for password reset
- Check spam folder
- Verify SMTP settings in Supabase
- Check email provider (some block automated emails)

### Redirect after password reset doesn't work
- Verify Site URL is correct
- Check Redirect URLs whitelist
- Ensure HTTPS in production

### User can't login after registration
- Check if email confirmation is disabled
- Verify user exists in Authentication → Users
- Check user_roles table has correct role

---

**Configuration Status:** ⚠️ Needs manual setup in Supabase Dashboard

**Next Step:** Run SQL migrations and create admin account
