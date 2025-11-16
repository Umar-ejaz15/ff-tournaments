# External Cron Setup Guide (Free Alternative)

## Why External Cron?

Vercel Hobby plan does **NOT** include cron jobs - this is a Pro plan feature.

## Free Solutions

### Option 1: cron-job.org (Recommended)

**Setup:**
1. Sign up at https://cron-job.org (free)
2. Create a new cron job
3. Configure:
   - **URL**: `https://your-app.vercel.app/api/cron/match-reminders`
   - **Method**: GET
   - **Request Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```
   - **Schedule**: Every 10-30 minutes
   - **Timeout**: 30 seconds

**Free Tier Limits:**
- Up to 3 cron jobs
- Can run every 10 minutes minimum
- Unlimited executions

### Option 2: EasyCron

**Setup:**
1. Sign up at https://www.easycron.com (free tier)
2. Create new cron job
3. Similar configuration as above

### Option 3: UptimeRobot

**Setup:**
1. Sign up at https://uptimerobot.com (free tier)
2. Use "HTTP(s) Monitor" type
3. Can also be used for monitoring + triggering

## Manual Setup Steps

1. **Get your endpoint URL:**
   ```
   https://your-app.vercel.app/api/cron/match-reminders
   ```

2. **Set environment variable in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `CRON_SECRET` = (generate a random secret key)

3. **Configure external cron service:**
   - Use the URL above
   - Add Authorization header with your secret
   - Set schedule (every 10-30 minutes recommended)

## Testing

Test the endpoint manually:
```bash
curl -X GET https://your-app.vercel.app/api/cron/match-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "tournamentsChecked": 0,
  "remindersSent": 0,
  "pushNotificationsSent": 0
}
```

## Security

The endpoint is protected by `CRON_SECRET`:
- Only requests with correct Authorization header are processed
- Keep your secret secure
- Don't share it publicly

## Recommended Schedule

For match reminders, run every **10-30 minutes**:
- Checks for tournaments starting soon
- Sends timely reminders
- Doesn't overwhelm users

## No Premium Features Required ✅

This setup works completely free with Vercel Hobby plan!

