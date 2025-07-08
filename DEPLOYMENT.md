# Deployment Checklist for Vercel

## Pre-Deployment Setup

### 1. Environment Variables (CRITICAL)
Set these in your Vercel dashboard → Settings → Environment Variables:

```bash
# Schiphol API Credentials
SCHIPHOL_APP_KEY=bf01b2f53e73e9db0115b8f2093c97b9
SCHIPHOL_APP_ID=cfcad115

# MongoDB Connection
MONGODB_URI=mongodb+srv://jasper:pindakaas@fly.83cukhh.mongodb.net/flyr-dashboard?retryWrites=true&w=majority&appName=fly
```

### 2. MongoDB Atlas Configuration
- Ensure your MongoDB Atlas cluster is accessible from Vercel's IP ranges
- Add `0.0.0.0/0` to IP Access List for testing (remove after deployment)
- Verify database user has proper permissions

### 3. Vercel Project Settings
- Set Node.js version to 18.x or higher
- Enable "Include source files outside of the root directory" if needed
- Set build command: `npm run build`
- Set output directory: `.next`

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production optimizations and error handling"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository
   - Set environment variables
   - Deploy

3. **Monitor Deployment**
   - Check build logs for errors
   - Verify environment variables are loaded
   - Test API endpoints

## Post-Deployment Verification

### 1. Check Environment Variables
Visit: `https://your-app.vercel.app/api/cache`
Should show cache statistics, not errors.

### 2. Test API Endpoints
- `/api/flights` - Should return flight data or proper error
- `/api/dashboard/kpis` - Should return dashboard metrics
- `/api/delay-trends/hourly` - Should return delay trends

### 3. Monitor Performance
- Check Vercel Function logs for timeouts
- Monitor API response times
- Verify caching is working

## Troubleshooting

### Issue: "No data available"
**Cause**: Environment variables not set or API credentials invalid
**Solution**: 
1. Check Vercel environment variables
2. Verify Schiphol API credentials
3. Check MongoDB connection

### Issue: "Super long loading time"
**Cause**: API timeouts or rate limiting
**Solution**:
1. Check Vercel Function logs
2. Verify API rate limits
3. Check MongoDB connection timeout

### Issue: "Build fails"
**Cause**: Missing dependencies or TypeScript errors
**Solution**:
1. Check build logs
2. Verify all dependencies are installed
3. Check for TypeScript errors

## Performance Optimizations

### 1. API Caching
- 10-minute cache for Schiphol API responses
- Automatic cache cleanup
- Shared cache keys for dashboard data

### 2. Error Handling
- Retry logic for failed API calls
- Timeout protection (30 seconds)
- Graceful fallbacks for missing data

### 3. Database Optimization
- Connection pooling (max 10 connections)
- Timeout settings for production
- IPv4 preference for faster connections

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor Function execution times
- Track API response times

### Error Tracking
- Check Vercel Function logs regularly
- Monitor for API rate limit errors
- Track MongoDB connection issues

## Security Notes

⚠️ **Important**: 
- Remove hardcoded credentials from code
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor for unauthorized access 