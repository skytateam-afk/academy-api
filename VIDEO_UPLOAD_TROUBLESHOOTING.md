# Video Upload Troubleshooting Guide

## Issue: "Media could not be loaded" error when uploading MP4 videos to courses

### What Was Fixed:
1. ✅ Added support for more video formats (MOV, AVI, MKV, WEBM)
2. ✅ Added better error logging with file details
3. ✅ Added automatic MIME type normalization for R2
4. ✅ Added cache control headers for video streaming

---

## Checklist to Fix the Issue:

### 1. **Verify Cloudflare R2 CORS Configuration**
This is the MOST COMMON cause of the error.

**Steps:**
1. Go to your Cloudflare R2 bucket settings
2. Navigate to "CORS Configuration"
3. Add this CORS policy:
```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2. **Verify R2 Bucket is Publicly Accessible**
1. In R2 Settings, check "Allow access to the bucket"
2. Enable public access via the custom domain
3. Make sure the `R2_PUBLIC_URL` environment variable is set correctly

### 3. **Check File Upload Details**
When uploading a video now, check the response includes:
```json
{
  "success": true,
  "data": {
    "previewVideoUrl": "https://your-r2-url/...",
    "mimetype": "video/mp4",
    "filename": "course-video.mp4",
    "size": 1234567
  }
}
```

### 4. **Verify Video Codec Compatibility**
The MP4 file must use:
- **Video Codec:** H.264 (AVC)
- **Audio Codec:** AAC
- **Container:** MP4

**To check if your video is compatible:**
```bash
ffmpeg -i video.mp4
```

Look for streams like:
```
Video: h264 (avc1)
Audio: aac
```

### 5. **Test the Video URL Directly**
1. Get the `previewVideoUrl` from the response
2. Open it in a new browser tab
3. If it doesn't play, it's an R2 configuration issue
4. Check browser console for CORS errors (red X with "blocked by CORS")

---

## If Video Still Doesn't Load:

### A. Check R2 Public Domain Settings
```
R2 Dashboard → Custom Domain → Settings
- Domain: your-r2-domain.com (make sure it's set)
- Access: Public (not private)
```

### B. Check Environment Variables
```bash
# In your .env file:
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-r2-domain.com  ← This must be your custom domain!
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
```

### C. Test R2 Connectivity
```bash
# Run this to verify R2 is responding
curl -I "https://your-r2-domain.com/test.txt"
```

Should return 404 (not 403 Forbidden)

### D. Check Browser Console
Open DevTools (F12) → Console tab
Look for errors like:
- ❌ "CORS policy: No 'Access-Control-Allow-Origin' header"
- ❌ "Failed to fetch" 
- ❌ "404 Not Found"

---

## Video Formats Now Supported:
- ✅ MP4 (.mp4)
- ✅ MOV (.mov) - Auto-converted to MP4
- ✅ AVI (.avi) - Auto-converted to MP4
- ✅ MKV (.mkv) - Auto-converted to MP4
- ✅ WEBM (.webm)

---

## Updated Code Files:
1. `modules/course_management/controllers/courseController.js` - Added format support & logging
2. `services/storageService.js` - Added MIME type normalization & cache headers

---

## Quick Diagnostic:
Run this to check your current setup:
```bash
# Check if video files are being uploaded
tail -f logs/combined.log | grep "preview_video\|uploadPreviewVideo"

# Look for:
✅ "File uploaded successfully" message
✅ Correct mimetype in logs
✅ Valid fileUrl in response
```

If you see the fileUrl but video still won't load → It's a **R2 CORS issue**
If upload fails → Check **file format** and **file size** (max 200MB)

---

## Still Having Issues?
1. Share the complete error message from browser console
2. Share the upload response with fileUrl
3. Try opening the video URL directly in browser
4. Check R2 bucket logs for access patterns
