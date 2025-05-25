# 🚀 DLoadly Deployment Guide

## Architecture Overview
- **Frontend (React + Vite)** → **Vercel**
- **Backend (Node.js + Express)** → **Railway**
- **Database** → **Firebase Firestore**
- **File Storage** → **Google Drive API**

## Prerequisites
- GitHub account
- Vercel account
- Railway account
- Firebase project setup
- Google Drive Service Account (optional)

## 📋 Step 1: Prepare Repository

```bash
# Clone and prepare
git clone https://github.com/your-username/dloadly.git
cd dloadly

# Run deployment script
./deploy.sh
```

## 📋 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project
1. Visit [Railway](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your DLoadly repository

### 2.2 Configure Railway Settings
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Port:** `5002`

### 2.3 Environment Variables
```env
NODE_ENV=production
PORT=5002
FRONTEND_URL=https://your-vercel-app.vercel.app
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
FIREBASE_PROJECT_ID=dloadly-301
FIREBASE_STORAGE_BUCKET=dloadly-301.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
EMAIL_USER=dloadly301@gmail.com
EMAIL_PASS=your_app_password
```

### 2.4 Get Railway URL
After deployment: `https://your-app-name.railway.app`

## 📋 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project
1. Visit [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click "Import Project"
4. Select your DLoadly repository

### 3.2 Configure Vercel Settings
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3.3 Environment Variables
```env
NODE_ENV=production
VITE_API_BASE_URL=https://your-railway-app.railway.app
VITE_SOCKET_URL=https://your-railway-app.railway.app
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dloadly-301
VITE_FIREBASE_STORAGE_BUCKET=dloadly-301.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3.4 Get Vercel URL
After deployment: `https://your-vercel-app.vercel.app`

## 📋 Step 4: Update CORS Configuration

Update Railway environment variable:
```env
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 📋 Step 5: Test Deployment

### 5.1 Backend Health Check
```bash
curl https://your-railway-app.railway.app/api/health
```

### 5.2 Frontend Access
Visit: `https://your-vercel-app.vercel.app`

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors
- Ensure `FRONTEND_URL` is correctly set on Railway
- Check Vercel URL is correct

#### 2. Environment Variables
- Verify all required env vars are set
- Check Firebase configuration

#### 3. Build Failures
- Check Node.js version compatibility
- Verify package.json scripts

#### 4. API Connection Issues
- Ensure Railway backend is running
- Check API base URL in frontend

### Debug Commands

```bash
# Check Railway logs
railway logs

# Check Vercel logs
vercel logs

# Test local build
npm run build

# Test API connection
curl -X GET https://your-railway-app.railway.app/api/health
```

## 📊 Monitoring

### Railway Monitoring
- Check CPU/Memory usage
- Monitor response times
- Review error logs

### Vercel Analytics
- Page load times
- Core Web Vitals
- Error tracking

## 🔄 Continuous Deployment

### Auto-Deploy Setup
1. **Railway:** Auto-deploys on push to main branch
2. **Vercel:** Auto-deploys on push to main branch

### Manual Deploy
```bash
# Force redeploy Railway
railway up

# Force redeploy Vercel
vercel --prod
```

## 💰 Cost Estimation

### Railway (Backend)
- **Hobby Plan:** $5/month
- **Pro Plan:** $20/month

### Vercel (Frontend)
- **Hobby Plan:** Free
- **Pro Plan:** $20/month

### Firebase
- **Spark Plan:** Free (limited)
- **Blaze Plan:** Pay-as-you-go

## 🔒 Security Checklist

- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Firebase security rules set
- [ ] API rate limiting enabled
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted

## 📈 Performance Optimization

### Frontend
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Caching configured
- [ ] Bundle size optimized

### Backend
- [ ] Database queries optimized
- [ ] Caching implemented
- [ ] Rate limiting configured
- [ ] Error handling robust

## 🎉 Success!

Your DLoadly application should now be live:
- **Frontend:** https://your-vercel-app.vercel.app
- **Backend:** https://your-railway-app.railway.app
- **Health Check:** https://your-railway-app.railway.app/api/health
