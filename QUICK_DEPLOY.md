# 🚀 INFOVERSE - Quick Deployment Guide

## ⚡ 5-Minute Vercel Deployment

### Prerequisites (5 min setup)
1. Create [Vercel Account](https://vercel.com/signup)
2. Create [MongoDB Atlas Free Cluster](https://www.mongodb.com/cloud/atlas/register)
3. Create [Cloudinary Account](https://cloudinary.com/users/register/free)
4. Gmail with [App Password](https://myaccount.google.com/apppasswords)

---

## 🎯 Step-by-Step Deployment

### 1️⃣ MongoDB Setup (2 minutes)
```
1. Create Free M0 cluster on MongoDB Atlas
2. Create database user (username + password)
3. Network Access → Allow 0.0.0.0/0
4. Get connection string: 
   mongodb+srv://username:password@cluster.mongodb.net/infoverse
```

### 2️⃣ Backend Deployment (3 minutes)
```
1. Go to vercel.com → New Project
2. Import GitHub repo → Select "backend" folder
3. Add these Environment Variables:

   NODE_ENV=production
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<generate_32_char_random_string>
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=<gmail_app_password>
   CLOUDINARY_CLOUD_NAME=<your_cloud_name>
   CLOUDINARY_API_KEY=<your_api_key>
   CLOUDINARY_API_SECRET=<your_api_secret>
   FRONTEND_URL=https://temp-url.com  (update later)

4. Deploy → Copy backend URL
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3️⃣ Frontend Deployment (2 minutes)
```
1. Go to vercel.com → New Project
2. Import SAME GitHub repo → Select "frontend" folder
3. Framework: Vite
4. Add Environment Variable:

   VITE_API_URL=<your_backend_url_from_step_2>

5. Deploy → Copy frontend URL
```

### 4️⃣ Update Backend CORS (1 minute)
```
1. Go to backend project on Vercel
2. Settings → Environment Variables
3. Edit FRONTEND_URL → Use actual frontend URL from step 3
4. Deployments → Redeploy
```

---

## ✅ Verify Deployment

### Test Backend:
```bash
curl https://your-backend-url.vercel.app/health
# Should return: {"status":"OK", ...}
```

### Test Frontend:
```
Open: https://your-frontend-url.vercel.app
Try login and test features
```

---

## 🎯 Supported Languages

**Your INFOVERSE supports:**
- ✅ Python (works 100% in Vercel)
- ✅ JavaScript (works 100% in Vercel)  
- ⚠️ Java (may need external API - see docs if it doesn't work)

**Not included**: C, C++ (not part of your project)

---

## 📋 Environment Variables Summary

### Backend (.env)
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.net/infoverse
JWT_SECRET=your_32_char_random_string
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@infoverse.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=https://your-frontend-url.vercel.app
OTP_EXPIRY=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend-url.vercel.app
```

---

## 🐛 Common Issues

**CORS Error?**
→ Update FRONTEND_URL in backend and redeploy

**Database Error?**
→ Check MongoDB IP whitelist (0.0.0.0/0) and connection string

**Build Failed?**
→ Check vercel logs, verify all dependencies in package.json

---

## 📚 Full Documentation
See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for complete guide

---

## 🆘 Need Help?
- Check [Troubleshooting Section](./VERCEL_DEPLOYMENT_GUIDE.md#troubleshooting)
- View Vercel function logs
- Verify environment variables
