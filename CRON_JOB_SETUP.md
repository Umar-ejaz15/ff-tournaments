# Cron Job Setup - Vercel Hobby Plan ✅

## Current Configuration

### Vercel Hobby Plan Limitation
- **1 cron job per day maximum**
- Current schedule: Daily at 9 AM UTC (`0 9 * * *`)

### What It Does
- Runs once per day at 9 AM UTC
- Checks for tournaments starting in the next 24 hours
- Sends reminders to all participants
- Sends push notifications (if subscribed)

### Notification Timing
Since this runs once per day, reminders are sent for tournaments:
- Starting within the next 24 hours (advance notice)
- Message format adjusts based on time:
  - Less than 1 hour: "X minutes"
  - 1-24 hours: "X hours and Y minutes"
  - More than 24 hours: Skipped

## Alternative Solutions for More Frequent Reminders

### Option 1: External Cron Service (Free)
Use services like:
- **cron-job.org** (free tier available)
- **EasyCron** (free tier available)
- **UptimeRobot** (free tier available)

**Setup:**
1. Create account on external service
2. Set up HTTP request to: `https://your-app.vercel.app/api/cron/match-reminders`
3. Add Authorization header: `Bearer YOUR_CRON_SECRET`
4. Schedule: Every 10-30 minutes (as needed)

### Option 2: Upgrade to Vercel Pro
- **Unlimited cron jobs**
- Run every 10 minutes or as needed
- Better for frequent reminders

**Current Hobby Plan Cron:**
```json
{
  "path": "/api/cron/match-reminders",
  "schedule": "0 9 * * *"
}
```

**Pro Plan (if upgraded):**
```json
{
  "path": "/api/cron/match-reminders",
  "schedule": "*/10 * * * *"
}
```

## Manual Testing

Test the endpoint manually:
```bash
curl -X GET https://your-app.vercel.app/api/cron/match-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Environment Variables Required

Make sure these are set in Vercel:
- `CRON_SECRET` - Secret key for authentication
- `VAPID_PUBLIC_KEY` - For push notifications
- `VAPID_PRIVATE_KEY` - For push notifications
- `VAPID_EMAIL` - For push notifications

## Recommendations

For best user experience:
1. **Daily cron** (current): Good for tournaments scheduled in advance
2. **External service**: Use for more frequent reminders (every 10-30 minutes)
3. **Hybrid approach**: Daily cron for advance notice + external service for immediate reminders

The current setup works well for tournaments scheduled in advance (next 24 hours).

