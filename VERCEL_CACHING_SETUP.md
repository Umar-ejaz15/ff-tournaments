# Vercel Hobby Plan - Deployment Caching Setup ✅

## Overview
This document explains the comprehensive caching setup optimized for Vercel Hobby plan to maximize performance and reduce costs.

## Caching Strategy

### 1. **Static Assets** (1 year cache)
- **Next.js build files**: `/_next/static/*` - Cached for 1 year (immutable)
- **Public assets**: Images, fonts, icons - Cached for 1 year
- **CDN caching**: Vercel's edge network caches these globally

### 2. **Dynamic API Routes** (Short cache with stale-while-revalidate)
- **Tournaments API**: 10 seconds cache, 60 seconds stale
- **Leaderboard API**: 30 seconds cache, 2 minutes stale
- **User-specific data**: No cache (wallet, transactions, etc.)

### 3. **Static Pages** (5 minutes cache)
- **Landing page**: 5 minutes cache with stale-while-revalidate

### 4. **Manifest & Service Worker** (1 hour cache)
- **manifest.json**: 1 hour cache, must-revalidate
- **sw.js**: 1 hour cache, must-revalidate

## Cache Headers Configuration

### In `next.config.ts`:
- Static assets: `max-age=31536000, immutable`
- API routes: `s-maxage` for edge caching
- Static pages: `s-maxage=300, stale-while-revalidate=600`

### In `vercel.json`:
- Additional edge cache headers
- Vercel-specific CDN cache control

## How It Works

### Edge Caching (Vercel CDN)
1. **First Request**: Goes to server, response cached at edge
2. **Subsequent Requests**: Served from edge cache (faster)
3. **Stale-While-Revalidate**: Serves stale cache while revalidating in background

### Benefits
- ✅ **Faster Load Times**: Static assets served from edge
- ✅ **Reduced Server Load**: Less database queries
- ✅ **Cost Savings**: Fewer function invocations
- ✅ **Better UX**: Instant responses from cache

## Cache Invalidation

### Automatic Invalidation:
- **Static assets**: Never invalidate (content-based hashing)
- **API routes**: Auto-invalidate after cache period
- **Stale-while-revalidate**: Updates in background

### Manual Invalidation:
To manually clear cache:
```bash
# Via Vercel CLI
vercel env pull
vercel --prod
```

Or via Vercel Dashboard:
1. Go to your project
2. Settings → Deployments
3. Redeploy or clear cache

## Monitoring Cache Performance

Check Vercel Analytics:
- **Edge Cache Hit Rate**: Should be high (>80%)
- **Response Times**: Should be low for cached content
- **Bandwidth Usage**: Reduced by caching

## API Route Cache Settings

| Route | Cache Duration | Stale While Revalidate | Reason |
|-------|---------------|------------------------|--------|
| `/api/tournaments` | 10s | 60s | Frequently accessed, changes occasionally |
| `/api/user/leaderboard` | 30s | 120s | Changes less frequently |
| `/api/user/wallet` | No cache | N/A | User-specific, must be fresh |
| `/api/user/transactions` | No cache | N/A | User-specific, sensitive data |

## Best Practices Applied

1. ✅ **Long cache for static assets** (1 year)
2. ✅ **Short cache for dynamic data** (10-30 seconds)
3. ✅ **Stale-while-revalidate** for instant responses
4. ✅ **No cache for user-specific data** (security)
5. ✅ **Vercel CDN headers** for edge caching

## Next Steps

After deployment, monitor:
- Cache hit rates in Vercel Analytics
- Response times
- Function invocation counts
- Bandwidth usage

If needed, adjust cache durations in:
- `next.config.ts` - for headers
- `vercel.json` - for edge cache
- Individual API routes - for specific caching

