# User Data Isolation & Multi-User System

## ✅ How the System Works

### **User Data Isolation (CORRECT BEHAVIOR)**
Each user sees **only their own data** - this is the correct and expected behavior:

1. **User Dashboard** (`/user`) - Shows only the logged-in user's:
   - Wallet balance
   - Tournament registrations
   - Transaction history
   - Notifications
   - Profile information

2. **Tournament Pages** - Users can:
   - See all available tournaments
   - Join tournaments (creates their own team)
   - View their own team details
   - See lobby codes for tournaments they joined

3. **Wallet & Transactions** - Each user has:
   - Their own wallet balance
   - Their own transaction history
   - Their own withdrawal requests

### **Multi-User System**
- ✅ **Multiple users can exist** - Each user has their own account
- ✅ **Each user sees only their data** - Data is filtered by `userId`
- ✅ **Only 1 admin** (or multiple if you create them) - Admins see all data

### **Admin vs User Access**
- **Users** (`role: "user"`):
  - Access: `/user/*` pages
  - See: Only their own data
  - Can: Join tournaments, manage wallet, view leaderboard

- **Admins** (`role: "admin"`):
  - Access: `/admin/*` pages
  - See: All users' data, all tournaments, all transactions
  - Can: Create tournaments, approve transactions, manage users

## 🔧 Fixed: OAuthAccountNotLinked Error

### **Problem**
When a user:
1. Signs up with email/password
2. Then tries to sign in with Google (same email)
3. Gets error: `OAuthAccountNotLinked`

### **Solution Implemented**
1. ✅ Added `allowDangerousEmailAccountLinking: true` to NextAuth config
2. ✅ Enhanced `signIn` callback to automatically link accounts
3. ✅ Improved error page to show helpful message
4. ✅ Accounts are now automatically linked when same email is used

### **How Account Linking Works**
- If user exists with email/password → Google account is automatically linked
- If user exists with Google → Can still use email/password (if password is set)
- Both methods work for the same user account
- User data remains the same regardless of sign-in method

## 📊 Database Structure

### **User Model**
```prisma
model User {
  id        String
  email     String (unique)
  name      String
  role      String (default: "user")
  // ... other fields
  
  accounts  Account[]  // Multiple sign-in methods
  wallet    Wallet     // One wallet per user
  teams     Team[]     // User's tournament teams
}
```

### **Account Model** (NextAuth)
```prisma
model Account {
  userId            String
  provider          String  // "google" or "credentials"
  providerAccountId String
  // ... OAuth tokens
}
```

- One User can have multiple Accounts (Google + Email/Password)
- All Accounts link to the same User record
- Same wallet, same teams, same data

## 🎯 Example Scenarios

### Scenario 1: New User
1. User signs up with email/password → Account created
2. User signs in with Google (same email) → Account linked automatically
3. User can now sign in with either method
4. Same wallet, same data, same everything

### Scenario 2: Existing Google User
1. User signs in with Google → Account created
2. User sets password later → Credentials account added
3. User can sign in with either method

### Scenario 3: Multiple Users
1. User A signs up → Sees only their data
2. User B signs up → Sees only their data
3. Admin signs in → Sees all users' data
4. Each user's data is completely isolated

## 🔒 Security & Data Privacy

- ✅ Each user's data is isolated by `userId`
- ✅ API routes check `session.user.id` before returning data
- ✅ Users cannot access other users' data
- ✅ Admins can see all data (by design)
- ✅ Account linking is secure (same email required)

## 📝 Code Examples

### **User Data Query (Isolated)**
```typescript
// app/api/user/wallet/route.ts
const session = await getServerSession(authOptions);
const wallet = await prisma.wallet.findUnique({
  where: { userId: session.user.id } // Only current user
});
```

### **Admin Data Query (All Users)**
```typescript
// app/api/admin/users/route.ts
const users = await prisma.user.findMany(); // All users
```

## ✅ Summary

1. **Each user sees only their data** ✅ (This is correct!)
2. **Multiple users can exist** ✅
3. **Only admins see all data** ✅
4. **OAuthAccountNotLinked error is fixed** ✅
5. **Accounts are automatically linked** ✅

The system is working as designed - user data isolation is a security feature, not a bug!

