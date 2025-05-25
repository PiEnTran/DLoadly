# 🔐 Railway Environment Variables - Complete List

## 🚨 **URGENT: Add these to Railway Dashboard NOW**

### **Required Security Secrets:**
```env
JWT_SECRET=LEJZXASEg7sk5SgpGpnCmrC4a7xF4t87Gr4uL6lZwjQ=
SESSION_SECRET=sDYvtbq02RAo+khopLHksLvY3nyvDB//FrZxVIji4HY=
COOKIE_SECRET=MdsOgDp4VWiML4STmbEe4h+hnZ8lvHcZc4GTpRGxMtQ=
```

### **Basic Configuration:**
```env
NODE_ENV=production
PORT=5002
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### **Firebase Configuration:**
```env
FIREBASE_API_KEY=AIzaSyDZxG9LmNdZf69uZ4ttjH7RlY5UoPamTBI
FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
FIREBASE_PROJECT_ID=dloadly-301
FIREBASE_STORAGE_BUCKET=dloadly-301.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=311277048392
FIREBASE_APP_ID=1:311277048392:web:377ec81519419ff7407e7d
```

### **Email Configuration:**
```env
EMAIL_USER=dloadly301@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here
```

### **Google Drive Configuration:**
```env
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_FOLDER_ID=1BAASl8vmAyMQYvVXc3jqTDLzG9N6VL_J
```

**For GOOGLE_DRIVE_CREDENTIALS:**
Copy the entire content from `google-drive-credentials.json` file as a single line.

### **Fshare Configuration (Optional):**
```env
FSHARE_EMAIL=your_fshare_email
FSHARE_PASSWORD=your_fshare_password
```

## 📋 **How to Add to Railway:**

### **1. Go to Railway Dashboard:**
1. Open your Railway project
2. Click on your service
3. Go to "Variables" tab

### **2. Add Environment Variables:**
1. Click "New Variable"
2. Add each variable one by one
3. Copy-paste the values exactly

### **3. Priority Order (Add these first):**
1. ✅ **JWT_SECRET** (Required immediately)
2. ✅ **SESSION_SECRET** (Required immediately)  
3. ✅ **COOKIE_SECRET** (Required immediately)
4. ✅ **NODE_ENV=production**
5. ✅ **PORT=5002**

### **4. After adding secrets:**
Railway will automatically redeploy and the backend should start successfully.

## ✅ **Expected Result:**
```
✅ Backend starts successfully
✅ No more "Missing required environment variables" error
✅ Health check available at: https://your-app.railway.app/api/health
✅ Ready for frontend connection
```

## 🎯 **Next Steps:**
1. **Add environment variables** to Railway
2. **Wait for automatic redeploy**
3. **Test health endpoint**
4. **Deploy frontend to Vercel**
5. **Update CORS with Vercel URL**

**Add these environment variables to Railway NOW to fix the deployment!** 🚀
