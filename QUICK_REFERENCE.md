# 🎯 Quick Reference: Routing & Features Guide

## 📍 URL Routes

### Public Routes
```
/                 → Landing page (accessible to everyone)
/auth/login       → Login page
/auth/signup      → Signup page
/auth/error       → Error page
```

### Regular User Routes (`/user/*`)
```
/user/player/dashboard     → Main player dashboard
/user/tournaments          → Browse & join tournaments
/user/leaderboard          → View leaderboard rankings
/user/wallet               → Manage coins & balance
/user/withdrawals          → Submit withdrawal requests
/user/transactions         → View transaction history
/user/support              → Submit support tickets
/user/profile              → Edit profile
/user/notifications        → View notifications
```

### Admin Routes (`/admin/*`)
```
/admin                     → Admin dashboard
/admin/users               → Manage all users
/admin/transactions        → Review payment transactions
/admin/tournaments         → Create & manage tournaments
/admin/statistics          → View system statistics
/admin/withdrawals         → Process withdrawals
/admin/support/requests    → Handle support tickets
/admin/announcements       → Send announcements
```

---

## 🔐 Authentication & Roles

### Login Flow
1. Click "Get Started" or "Login" button
2. Enter email/password OR click "Sign in with Google"
3. System checks database for user role
4. **Regular User** → Redirects to `/user/player/dashboard`
5. **Admin** → Redirects to `/admin`

### User Roles
- **`user`** - Regular player account
- **`admin`** - Administrative account with full platform access

### Logout
- Click username in navbar
- Select "Logout" from menu
- Session cleared, redirected to landing page

---

## 🛡️ Access Control Rules

### Regular Users Cannot:
- ❌ Access `/admin/*` routes
- ❌ Create/delete tournaments
- ❌ View other users' full details
- ❌ Modify transaction status

### Regular Users Can:
- ✅ Browse tournaments
- ✅ Join tournaments
- ✅ View leaderboard
- ✅ Buy coins
- ✅ Withdraw coins
- ✅ Submit support tickets

### Admins Cannot:
- ❌ Play as regular users (use separate account)
- ❌ Join tournaments (unless has user role)

### Admins Can:
- ✅ Manage all users
- ✅ Review transactions
- ✅ Create tournaments
- ✅ Approve/reject withdrawals
- ✅ Send announcements
- ✅ View platform statistics
- ✅ Handle support requests

---

## 📱 Device Responsiveness

### Mobile (< 640px)
- Single-column layouts
- Hamburger menu in navbar
- Smaller fonts & icons
- Touch-friendly buttons (44px minimum)
- Full-width cards

### Tablet (640px - 1024px)
- Two-column layouts where applicable
- More spacious padding
- Medium font sizes
- Better icon visibility

### Desktop (> 1024px)
- Multi-column layouts
- Horizontal navigation menus
- Full sidebar navigation (admin)
- Larger icons and fonts
- Optimized spacing

---

## 🎮 Features Overview

### Tournaments System
- Browse available tournaments
- Join with squad/team
- View tournament details
- Check tournament status
- See prize distribution

### Wallet & Coins
- Buy coins with EasyPaisa/NayaPay
- View coin balance
- Submit withdrawal requests
- Track transaction history
- View payment methods

### Leaderboard
- View global rankings
- See player statistics
- Filter by tournament
- Track climbing progress

### Support System
- Submit support tickets
- Track ticket status
- Chat with support team
- View help documentation

### Admin Tools
- User management dashboard
- Transaction approval system
- Tournament creation & management
- Statistics & analytics
- Announcement broadcasting
- Withdrawal processing

---

## 🔄 Role-Based Redirects

### If user tries wrong URL:
```
Regular User accessing /admin/users
  ↓
Middleware checks role
  ↓
Role = "user" (not "admin")
  ↓
REDIRECT to /user/player/dashboard
```

```
Admin accessing /user/tournaments
  ↓
Navbar detects role mismatch
  ↓
Role = "admin" in /user route
  ↓
REDIRECT to /admin
```

---

## 🚀 Common Tasks

### Join a Tournament (Regular User)
1. Click "Tournaments" in navbar
2. Browse available tournaments
3. Click "Join" button
4. Confirm team details
5. Ready to compete!

### Buy Coins (Regular User)
1. Click "Wallet" in navbar
2. Select amount (50/100/250 coins)
3. Choose payment method
4. Click "Buy Now"
5. Upload payment proof
6. Wait for admin approval
7. Coins added to account

### Withdraw Coins (Regular User)
1. Go to "Wallet"
2. Scroll to "Withdraw Coins" section
3. Enter amount (max 1200)
4. Select method (EasyPaisa/NayaPay)
5. Enter account number
6. Submit request
7. Admin processes withdrawal

### Manage Users (Admin)
1. Go to "/admin/users"
2. Search or browse users
3. View user details
4. Change user role
5. Disable/enable accounts
6. View user transactions

### Create Tournament (Admin)
1. Go to "/admin/tournaments"
2. Click "Create Tournament"
3. Enter tournament details
4. Set start date/time
5. Configure prize pool
6. Publish tournament
7. Tournaments appear for users

### Approve Transactions (Admin)
1. Go to "/admin/transactions"
2. Filter by status: "pending"
3. Review transaction details
4. Click "Approve" or "Reject"
5. Add admin note (optional)
6. Save changes

---

## 🔧 Troubleshooting

### Problem: "Unauthorized access" error
**Solution:**
- Clear browser cookies/cache
- Log out completely
- Log back in
- Check user role in database

### Problem: Can't access admin dashboard
**Solution:**
- Verify account has "admin" role
- Check if account is disabled
- Try logging out and back in

### Problem: Coins not showing after purchase
**Solution:**
- Refresh page
- Check transaction history
- Contact admin if still missing

### Problem: Redirect loops
**Solution:**
- This has been fixed! If still occurring:
  - Clear session cache
  - Log out and back in
  - Check browser console for errors

### Problem: Mobile navbar menu won't toggle
**Solution:**
- Refresh page
- Check if JavaScript is enabled
- Try different browser

---

## 📊 Database Roles

Database stores roles as:
- `"user"` - Regular player
- `"admin"` - Administrator

System always normalizes to lowercase for consistency.

---

## 🎨 UI Elements

### Status Badges
- 🟢 **Green** - Approved
- 🔴 **Red** - Rejected
- 🟡 **Yellow** - Pending
- 🔵 **Blue** - Processing

### Navigation
- **Navbar** - Top navigation (fixed position)
- **Sidebar** - Not used (mobile-first design)
- **Mobile Menu** - Hamburger toggle on small screens

### Color Scheme
- Primary: Yellow (500, 400)
- Secondary: Gray (800, 900)
- Success: Green (400-600)
- Warning: Yellow (400-500)
- Error: Red (400-600)
- Info: Blue (400-600)

---

## ✅ Version Info

- **Next.js:** 16.0.0
- **NextAuth:** 4.24.13
- **Prisma:** 6.19.0
- **React:** 19.2.0
- **TailwindCSS:** 4

---

**Need help?** Check the main documentation or contact support.
