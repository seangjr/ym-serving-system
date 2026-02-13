---
status: complete
phase: 01-foundation-and-authentication
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-REWORK-SUMMARY.md, 01-04-SUMMARY.md, 01-otp-SUMMARY.md
started: 2026-02-13T12:00:00Z
updated: 2026-02-13T12:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Login with valid credentials
expected: Go to /login. Enter valid email and password. Click "Sign in". You should be redirected to /dashboard with sidebar navigation visible.
result: pass

### 2. Login with invalid credentials
expected: Go to /login. Enter a wrong password. Click "Sign in". An inline error message ("Invalid email or password") should appear below the form — no page redirect.
result: pass

### 3. Protected route redirect
expected: Open a new incognito/private window. Navigate directly to /dashboard. You should be automatically redirected to /login.
result: pass

### 4. Sign out
expected: While logged in, click the user avatar at the bottom of the sidebar. In the dropdown menu, click "Sign out". You should be redirected to /login.
result: pass

### 5. Session persistence
expected: While logged in on /dashboard, refresh the browser (Cmd+R). You should remain logged in on the same page — no redirect to login.
result: pass

### 6. Role-based navigation (Admin)
expected: Log in as an Admin user. The sidebar should show 8 navigation items: Services, Team Roster, Songs, Announcements, Equipment, Reports, Files, Admin.
result: pass

### 7. Sidebar collapse/expand
expected: Click the sidebar trigger button (top-left of main content area). The sidebar should collapse to an icon-only rail showing just icons. Click again to expand. Tooltips should appear on hover when collapsed.
result: pass

### 8. User dropdown menu
expected: Click the user avatar area at the bottom of the sidebar. A dropdown should appear showing: your email, your role, theme options (Light/Dark/System), and Sign out.
result: pass

### 9. Dark mode toggle
expected: Open the user dropdown menu. Click "Dark" — the entire app should switch to dark theme. Click user menu again and select "Light" — it should switch back. Theme should persist across page refresh.
result: pass

### 10. Forgot password flow — request OTP
expected: On /login, click "Forgot your password?". You should arrive at /forgot-password. Enter your email and submit. You should see a success message and be redirected to /verify with a countdown timer.
result: pass

### 11. OTP verification
expected: On /verify, enter the 6-digit OTP code (check email or console in dev mode). On correct code, you should be redirected to /setup-password.
result: skipped
reason: Requires real OTP code — cannot automate without intercepting email or dev console

### 12. Setup new password
expected: On /setup-password, type a new password. Real-time checkmarks should appear for each requirement (8+ chars, uppercase, lowercase, number, special char). Enter matching confirmation. Submit should succeed and redirect to /login.
result: skipped
reason: Depends on Test 11 OTP verification

### 13. Admin panel — view users
expected: As an Admin, navigate to /admin. You should see a list of users with their email, name, and current serving role (Admin/Committee/Member). On desktop: table layout. On mobile: card layout.
result: pass

### 14. Admin panel — change user role
expected: On /admin, change a user's serving role using the dropdown (e.g., Member → Committee). The change should save and the updated role should persist on page refresh.
result: pass

### 15. Login page branding
expected: Go to /login. You should see the YM logo above "YM Serving Team" title, "Sign in to your account" subtitle, email/password fields, "SIGN IN" button, and "Forgot your password?" link.
result: pass

### 16. Mobile responsive layout
expected: Resize the browser to mobile width (~375px). The sidebar should collapse into a mobile sheet/drawer. The login page should remain centered and usable. Touch targets should be comfortably tappable.
result: pass

## Summary

total: 16
passed: 14
issues: 0
pending: 0
skipped: 2

## Gaps

[none yet]
