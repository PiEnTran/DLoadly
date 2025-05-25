# 🚀 DLoadly Production Configuration Update

## ✅ **Current Status:**
- **Frontend Vercel:** `https://d-loadly.vercel.app` ✅ Working
- **Backend Railway:** `https://dloadly-production.up.railway.app` ✅ Working
- **Health Check:** ✅ Backend responding correctly

## 🔧 **URGENT: Update Environment Variables**

### **1. Vercel Frontend Environment Variables**

**Go to Vercel Dashboard → DLoadly Project → Settings → Environment Variables**

Add/Update these variables:

```env
# Production Environment
NODE_ENV=production

# Backend API URLs (UPDATED)
VITE_API_BASE_URL=https://dloadly-production.up.railway.app
VITE_SOCKET_URL=https://dloadly-production.up.railway.app

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDZxG9LmNdZf69uZ4ttjH7RlY5UoPamTBI
VITE_FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dloadly-301
VITE_FIREBASE_STORAGE_BUCKET=dloadly-301.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=311277048392
VITE_FIREBASE_APP_ID=1:311277048392:web:377ec81519419ff7407e7d
VITE_FIREBASE_MEASUREMENT_ID=G-HQXTFFF5BK
```

### **2. Railway Backend Environment Variables**

**Go to Railway Dashboard → DLoadly Project → Variables**

Add/Update these variables:

```env
# Basic Configuration
NODE_ENV=production
PORT=8080

# Frontend URL (UPDATED)
FRONTEND_URL=https://d-loadly.vercel.app
CORS_ORIGIN=https://d-loadly.vercel.app

# Security Secrets (REQUIRED)
JWT_SECRET=LEJZXASEg7sk5SgpGpnCmrC4a7xF4t87Gr4uL6lZwjQ=
SESSION_SECRET=sDYvtbq02RAo+khopLHksLvY3nyvDB//FrZxVIji4HY=
COOKIE_SECRET=MdsOgDp4VWiML4STmbEe4h+hnZ8lvHcZc4GTpRGxMtQ=

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyDZxG9LmNdZf69uZ4ttjH7RlY5UoPamTBI
FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
FIREBASE_PROJECT_ID=dloadly-301
FIREBASE_STORAGE_BUCKET=dloadly-301.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=311277048392
FIREBASE_APP_ID=1:311277048392:web:377ec81519419ff7407e7d

# Email Configuration
EMAIL_USER=dloadly301@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here

# Google Drive Configuration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=1BAASl8vmAyMQYvVXc3jqTDLzG9N6VL_J
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"dloadly-drive-api",...}

# Fshare Configuration (Optional)
FSHARE_EMAIL=your_fshare_email
FSHARE_PASSWORD=your_fshare_password
```

## 📋 **Step-by-Step Instructions:**

### **Step 1: Update Vercel Environment Variables**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your DLoadly project
3. Click **Settings** → **Environment Variables**
4. Add/Update the variables above
5. Click **Save**
6. **Redeploy** the project

### **Step 2: Update Railway Environment Variables**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Find your DLoadly project
3. Click on your service
4. Go to **Variables** tab
5. Add/Update the variables above
6. Railway will **auto-redeploy**

### **Step 3: Wait for Deployments**
- **Vercel:** Manual redeploy needed
- **Railway:** Auto-redeploy on variable changes

## 🧪 **Testing After Update:**

### **1. Test Backend Health:**
```bash
curl https://dloadly-production.up.railway.app/api/health
```

### **2. Test Frontend:**
Visit: `https://d-loadly.vercel.app`

### **3. Test API Connection:**
- Open browser console on frontend
- Check for CORS errors
- Test login/register functionality

## ✅ **Expected Results:**
- ✅ No CORS errors in browser console
- ✅ Frontend can connect to backend API
- ✅ Login/Register works
- ✅ Download functionality works
- ✅ Admin panel accessible

## 🚨 **If Issues Occur:**

### **CORS Errors:**
- Double-check `FRONTEND_URL` and `CORS_ORIGIN` on Railway
- Ensure no trailing slashes in URLs

### **API Connection Failed:**
- Verify `VITE_API_BASE_URL` on Vercel
- Check Railway backend is running

### **Authentication Issues:**
- Verify Firebase configuration on both platforms
- Check JWT secrets are set on Railway

## 🎯 **Next Steps After Configuration:**
1. ✅ Test all functionality
2. ✅ Setup monitoring
3. ✅ Performance optimization
4. ✅ Security review
5. ✅ User testing

**Update these environment variables NOW to complete the deployment!** 🚀
