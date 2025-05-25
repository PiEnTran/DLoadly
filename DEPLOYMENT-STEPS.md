# 🚀 DLoadly Deployment Guide - Vercel + Railway

## 📋 **Step 1: Deploy Backend to Railway**

### **1.1 Create Railway Account**
1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub account
3. Connect your GitHub repository

### **1.2 Deploy Backend**
1. Click "New Project" → "Deploy from GitHub repo"
2. Select `DLoadly` repository
3. Railway will auto-detect the backend
4. Click "Deploy"

### **1.3 Configure Environment Variables**
Add these environment variables in Railway dashboard:

```env
# Basic Configuration
NODE_ENV=production
PORT=5002

# Frontend URL (will update after Vercel deployment)
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyDZxG9LmNdZf69uZ4ttjH7RlY5UoPamTBI
FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
FIREBASE_PROJECT_ID=dloadly-301
FIREBASE_STORAGE_BUCKET=dloadly-301.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=311277048392
FIREBASE_APP_ID=1:311277048392:web:377ec81519419ff7407e7d

# Email Configuration
EMAIL_USER=dloadly301@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Google Drive Configuration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=1BAASl8vmAyMQYvVXc3jqTDLzG9N6VL_J
GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"dloadly-drive-api",...}

# Fshare Configuration (Optional)
FSHARE_EMAIL=your_fshare_email
FSHARE_PASSWORD=your_fshare_password

# Security Secrets (Generate new ones!)
SESSION_SECRET=your_new_session_secret_here
JWT_SECRET=your_new_jwt_secret_here
COOKIE_SECRET=your_new_cookie_secret_here
```

### **1.4 Get Railway URL**
After deployment: `https://your-app-name.railway.app`

## 📋 **Step 2: Deploy Frontend to Vercel**

### **2.1 Create Vercel Account**
1. Go to [Vercel.com](https://vercel.com)
2. Sign in with GitHub account
3. Import your repository

### **2.2 Deploy Frontend**
1. Click "New Project"
2. Import `DLoadly` repository
3. Set **Root Directory** to `frontend`
4. Framework: **Vite**
5. Build Command: `npm run build`
6. Output Directory: `dist`

### **2.3 Configure Environment Variables**
Add these in Vercel dashboard:

```env
# Production Environment
NODE_ENV=production

# Backend API URL (from Railway)
VITE_API_BASE_URL=https://your-railway-app.railway.app
VITE_SOCKET_URL=https://your-railway-app.railway.app

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDZxG9LmNdZf69uZ4ttjH7RlY5UoPamTBI
VITE_FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dloadly-301
VITE_FIREBASE_STORAGE_BUCKET=dloadly-301.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=311277048392
VITE_FIREBASE_APP_ID=1:311277048392:web:377ec81519419ff7407e7d
VITE_FIREBASE_MEASUREMENT_ID=G-HQXTFFF5BK
```

### **2.4 Get Vercel URL**
After deployment: `https://your-vercel-app.vercel.app`

## 📋 **Step 3: Update CORS Configuration**

### **3.1 Update Railway Environment**
Go back to Railway and update:
```env
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### **3.2 Redeploy Railway**
Railway will auto-redeploy with new environment variables.

## 📋 **Step 4: Test Deployment**

### **4.1 Backend Health Check**
```bash
curl https://your-railway-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "services": {
    "googleDrive": "Connected",
    "email": "Configured",
    "fshare": "Configured"
  }
}
```

### **4.2 Frontend Access**
Visit: `https://your-vercel-app.vercel.app`

### **4.3 Full Integration Test**
1. Register new account
2. Verify email
3. Download a TikTok video
4. Check Google Drive upload
5. Test admin panel

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **1. CORS Errors**
- Ensure `FRONTEND_URL` is correctly set on Railway
- Check Vercel URL is correct
- Verify no trailing slashes

#### **2. Environment Variables**
- Double-check all required env vars are set
- Verify Firebase configuration
- Ensure Google Drive credentials are properly formatted

#### **3. Build Failures**
- Check Node.js version compatibility
- Verify package.json scripts
- Check build logs for specific errors

#### **4. API Connection Issues**
- Ensure Railway backend is running
- Check API base URL in frontend
- Verify health endpoint responds

## 📊 **Monitoring**

### **Railway Monitoring:**
- Check CPU/Memory usage
- Monitor response times
- Review error logs

### **Vercel Analytics:**
- Page load times
- Core Web Vitals
- Error tracking

## 🎉 **Success Checklist**

- [ ] Railway backend deployed successfully
- [ ] Vercel frontend deployed successfully
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Health check passes
- [ ] Frontend loads correctly
- [ ] API connection working
- [ ] Firebase authentication working
- [ ] Google Drive integration working
- [ ] Email service working
- [ ] Admin panel accessible
- [ ] Download functionality working

## 🔄 **Continuous Deployment**

Both platforms auto-deploy on push to main branch:
- **Railway:** Auto-deploys backend changes
- **Vercel:** Auto-deploys frontend changes

## 💰 **Cost Estimation**

### **Railway (Backend):**
- **Hobby Plan:** $5/month
- **Pro Plan:** $20/month

### **Vercel (Frontend):**
- **Hobby Plan:** Free
- **Pro Plan:** $20/month

**Total minimum cost: $5/month** 💰

---

**🎊 Congratulations! DLoadly is now live in production!** 🚀
