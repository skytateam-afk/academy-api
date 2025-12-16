# CORS Configuration Guide

## Overview

Cross-Origin Resource Sharing (CORS) is now fully configured through environment variables, eliminating hard-coded origins and making it easier to manage across different environments.

## Configuration

### Environment Variable

All CORS origins are now managed through the `CORS_ORIGIN` environment variable in your `.env` file.

```env
# CORS - Comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002,https://academy.skyta.space,https://academy-app-6qdg.vercel.app
```

### Key Features

1. **Environment-Based**: No more hard-coded origins in server.js
2. **Multiple Origins**: Support comma-separated list of origins
3. **Auto-Trimming**: Whitespace around origins is automatically removed
4. **Fallback**: Defaults to `http://localhost:3000` if not set
5. **Full Configuration**: Includes credentials, methods, and headers

## How It Works

### Server Configuration (server.js)

```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### What This Does

1. **Splits**: Separates the comma-separated string into an array
2. **Trims**: Removes any whitespace from each origin
3. **Fallback**: Uses `localhost:3000` if CORS_ORIGIN is not defined
4. **Credentials**: Allows cookies and authorization headers
5. **Methods**: Permits all standard HTTP methods
6. **Headers**: Allows Content-Type and Authorization headers

## Setup Instructions

### 1. Development Environment

Update your `.env` file:

```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

### 2. Staging Environment

```env
NODE_ENV=staging
CORS_ORIGIN=https://staging.yourdomain.com,https://staging-app.yourdomain.com
```

### 3. Production Environment

```env
NODE_ENV=production
CORS_ORIGIN=https://academy.skyta.space,https://academy-app-6qdg.vercel.app,https://yourdomain.com
```

## Adding New Origins

### Method 1: Update .env File

Simply add the new origin to the comma-separated list:

```env
CORS_ORIGIN=http://localhost:3000,https://newdomain.com,https://another-domain.com
```

### Method 2: Environment Variables (Production)

For production environments (Vercel, Render, etc.), update the environment variable in your hosting platform's dashboard:

**Vercel:**
1. Go to Project Settings
2. Navigate to Environment Variables
3. Update `CORS_ORIGIN` value
4. Redeploy your application

**Render:**
1. Go to your service dashboard
2. Navigate to Environment
3. Update `CORS_ORIGIN` value
4. Service will auto-redeploy

## Important Notes

### ⚠️ No Spaces in Origins

❌ **Wrong:**
```env
CORS_ORIGIN=http://localhost:3000, https://yourdomain.com, https://app.yourdomain.com
```

✅ **Correct:**
```env
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com,https://app.yourdomain.com
```

**Note:** The configuration now auto-trims whitespace, but it's still best practice to avoid spaces.

### 🔒 Security Considerations

1. **Never use `*` (wildcard)** in production
2. **Only add trusted domains** to CORS_ORIGIN
3. **Use HTTPS** in production environments
4. **Review origins regularly** and remove unused ones
5. **Don't commit production origins** to git (use .env, not .env.example)

### 📝 Protocol and Port Specificity

CORS is strict about matching:
- Protocol must match: `http://` vs `https://`
- Port must match: `:3000` vs `:3001`
- Subdomain must match: `app.domain.com` vs `domain.com`

Each variation needs to be explicitly added:
```env
CORS_ORIGIN=http://localhost:3000,https://localhost:3000,http://app.domain.com,https://app.domain.com
```

## Testing CORS

### 1. Test with curl

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     http://localhost:4000/api/auth/login
```

### 2. Test in Browser Console

```javascript
fetch('http://localhost:4000/api/health', {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('CORS Error:', error));
```

### 3. Check Browser DevTools

Open your browser's DevTools (F12):
1. Go to **Network** tab
2. Make a request to your API
3. Check response headers:
   - `Access-Control-Allow-Origin` should show your origin
   - `Access-Control-Allow-Credentials` should be `true`
   - `Access-Control-Allow-Methods` should list allowed methods

## Troubleshooting

### Issue: CORS Error in Browser

**Error Message:**
```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solutions:**

1. **Check CORS_ORIGIN includes your frontend URL:**
   ```env
   CORS_ORIGIN=http://localhost:3000,...
   ```

2. **Verify exact match** (protocol, domain, port):
   ```
   Frontend: http://localhost:3000
   .env:     http://localhost:3000  ✅
   .env:     http://localhost:3001  ❌ (different port)
   ```

3. **Restart your server** after changing .env:
   ```bash
   # Stop server (Ctrl+C)
   npm start
   ```

4. **Clear browser cache** or use incognito mode

### Issue: Credentials Not Working

**Error:**
```
The value of the 'Access-Control-Allow-Credentials' header is '' which must be 'true'
```

**Solution:**
Ensure your frontend includes credentials:

```javascript
// Fetch API
fetch(url, {
    credentials: 'include'
});

// Axios
axios.get(url, {
    withCredentials: true
});
```

### Issue: Environment Variable Not Loading

**Check:**

1. **File name:** Must be exactly `.env`
2. **Location:** Must be in project root
3. **Format:** No quotes needed around values
   ```env
   CORS_ORIGIN=http://localhost:3000  ✅
   CORS_ORIGIN="http://localhost:3000"  ❌
   ```
4. **Server restart:** Required after .env changes

## Migration from Old Configuration

### Before (Hard-coded)

```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN?.split(',') || []
        : ['https://academy.skyta.space','http://localhost:3000'],
    credentials: true
}));
```

### After (Environment-based)

```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Benefits

✅ No more hard-coded origins
✅ Same configuration for all environments
✅ Easy to add/remove origins
✅ More explicit HTTP methods and headers
✅ Auto-trimming of whitespace
✅ Better fallback handling

## Common Origins to Add

### Development
```env
http://localhost:3000        # React default
http://localhost:3001        # Alternative port
http://localhost:5173        # Vite default
http://localhost:8080        # Vue CLI default
http://127.0.0.1:3000        # IP-based localhost
```

### Production
```env
https://yourdomain.com       # Main domain
https://www.yourdomain.com   # WWW subdomain
https://app.yourdomain.com   # App subdomain
https://admin.yourdomain.com # Admin subdomain
```

### Vercel Preview Deployments
```env
https://your-app-git-branch-username.vercel.app    # Git branch previews
https://your-app-hash.vercel.app                   # Deployment previews
```

## Best Practices

1. **Keep Development Simple**
   ```env
   # Development
   CORS_ORIGIN=http://localhost:3000
   ```

2. **Be Explicit in Production**
   ```env
   # Production - list all domains that need access
   CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
   ```

3. **Use Separate .env Files**
   - `.env.development` - Development settings
   - `.env.staging` - Staging settings
   - `.env.production` - Production settings (never commit!)

4. **Document Your Origins**
   ```env
   # CORS Configuration
   # Format: comma-separated URLs (no spaces)
   # Development: local ports
   # Production: production domains only
   CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
   ```

5. **Regular Audits**
   - Review CORS_ORIGIN monthly
   - Remove deprecated/unused origins
   - Verify all origins are still necessary

## Summary

✅ **CORS is now environment-based**
✅ **No hard-coded origins in code**
✅ **Easy to manage across environments**
✅ **Proper security with explicit origins**
✅ **Clear documentation and examples**

---

**Last Updated:** December 16, 2025
**Version:** 1.0
**Status:** ✅ Complete and Production-Ready
