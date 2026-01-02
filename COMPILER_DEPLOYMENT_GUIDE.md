# Compiler/Judge System Deployment Guide

## 🚨 Problem Statement

When deploying to Vercel or other serverless platforms, the code compiler only works for JavaScript. Python and Java fail with "module not found" errors because these platforms **do not have Python/Java compilers installed** in their serverless runtime environment.

## ✅ Solution Implemented

We've implemented an **automatic dual-mode system**:

1. **Development Mode (localhost)**: Uses local compilers (Python, Java, C/C++, JavaScript)
2. **Production Mode (Vercel/deployment)**: Uses external code execution API (Piston API by default)

### How It Works

The system automatically detects the environment:
- If `VERCEL=1` or `NODE_ENV=production` → Uses **External API**
- Otherwise → Uses **Local Compilers**

## 🔧 Configuration

### Option 1: Piston API (Recommended - FREE, No Setup Required)

**Piston** is a free, open-source code execution engine that requires **no API key**.

1. **No setup needed!** The system uses Piston by default in production.
2. Supports: JavaScript, Python, Java, C, C++

### Option 2: Judge0 API (Alternative)

If you prefer Judge0:

1. **Get API Key (Optional)**:
   - Visit [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce)
   - Subscribe to free tier (50 calls/day)
   - Get your RapidAPI key

2. **Set Environment Variables in Vercel**:
   ```bash
   JUDGE0_API_KEY=your_rapidapi_key_here
   JUDGE0_USE_RAPIDAPI=true
   JUDGE_API_PROVIDER=judge0
   ```

### Option 3: Force External API (Even in Development)

Set this environment variable to test external API locally:
```bash
USE_EXTERNAL_JUDGE=true
```

## 📝 Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables:

### Required Variables (None by default!)
The system works out of the box with Piston API.

### Optional Variables
```
# If you want to use Judge0 instead of Piston:
JUDGE0_API_KEY=your_rapidapi_key
JUDGE0_USE_RAPIDAPI=true
JUDGE_API_PROVIDER=judge0

# If you want to force external API in all environments:
USE_EXTERNAL_JUDGE=true
```

## 🚀 Deployment Steps

1. **Commit and push the changes**:
   ```bash
   git add .
   git commit -m "Add external code execution API for deployment"
   git push
   ```

2. **Vercel will automatically redeploy**
   - No additional configuration needed!
   - Piston API works immediately

3. **Test the compiler**:
   - Try submitting Python code
   - Try submitting Java code
   - Try submitting JavaScript code
   - All should work now! ✅

## 🧪 Testing

### Test Locally (with local compilers):
```bash
cd backend
npm run dev
# Submit code - will use local compilers
```

### Test with External API Locally:
```bash
cd backend
USE_EXTERNAL_JUDGE=true npm run dev
# Submit code - will use Piston/Judge0 API
```

## 📊 Supported Languages

| Language   | Local (Dev) | Piston (Prod) | Judge0 (Prod) |
|------------|-------------|---------------|---------------|
| JavaScript | ✅          | ✅            | ✅            |
| Python     | ✅          | ✅            | ✅            |
| Java       | ✅          | ✅            | ✅            |
| C          | ✅          | ✅            | ✅            |
| C++        | ✅          | ✅            | ✅            |

## 🔍 Troubleshooting

### Issue: External API fails
**Solution**: Check your internet connection and API status:
- Piston: https://emkc.org/api/v2/piston/runtimes
- Judge0: Check RapidAPI dashboard

### Issue: "Rate limit exceeded" (Judge0 only)
**Solution**: 
- Upgrade your RapidAPI subscription, OR
- Use Piston API (no rate limits on free tier)

### Issue: Timeout errors
**Solution**: Increase `maxDuration` in vercel.json:
```json
{
  "config": {
    "maxDuration": 60
  }
}
```

### Issue: Still using local compilers in production
**Solution**: Check environment variables:
```bash
# Should see this in Vercel logs:
[judge] 🌐 Using external API (deployment mode) for language: python
```

## 📚 API Details

### Piston API (Default)
- **URL**: https://emkc.org/api/v2/piston
- **Cost**: FREE ✨
- **Rate Limit**: Generous (no key required)
- **Docs**: https://github.com/engineer-man/piston

### Judge0 API (Alternative)
- **URL**: https://judge0-ce.p.rapidapi.com
- **Cost**: Free tier (50 calls/day), paid plans available
- **Rate Limit**: Depends on plan
- **Docs**: https://ce.judge0.com

## 🎉 Benefits

1. ✅ **Works on Vercel** - No compiler installation needed
2. ✅ **Secure** - Code runs in isolated sandbox
3. ✅ **Fast** - Optimized execution environment
4. ✅ **Reliable** - Professional infrastructure
5. ✅ **Free** - Piston API requires no payment
6. ✅ **Automatic** - Switches based on environment
7. ✅ **Fallback** - Falls back to local for JavaScript

## 🔄 Migration Notes

- **No breaking changes** - Existing code continues to work
- **Automatic detection** - No manual configuration needed
- **Backward compatible** - Local development unchanged
- **Seamless experience** - Users won't notice any difference

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test with Piston API first (no setup required)
4. Check the external API status pages

---

**Last Updated**: January 2026
**Status**: ✅ Production Ready
