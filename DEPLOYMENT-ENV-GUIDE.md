# 🚀 DLoadly Deployment Environment Variables

## 🔧 **Railway Backend Environment Variables**

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
- Use the JSON content from `google-drive-credentials.json` file
- Copy the entire JSON as a single line string
- Paste into Railway environment variables

### **Security Secrets:**
```env
SESSION_SECRET=generate_random_32_char_string
JWT_SECRET=generate_random_32_char_string  
COOKIE_SECRET=generate_random_32_char_string
```

## 🌐 **Vercel Frontend Environment Variables**

```env
NODE_ENV=production
VITE_API_BASE_URL=https://your-railway-app.railway.app
VITE_SOCKET_URL=https://your-railway-app.railway.app

VITE_FIREBASE_API_KEY=AIzaSyDZxG9LmNdZf69uZ4ttjH7RlY5UoPamTBI
VITE_FIREBASE_AUTH_DOMAIN=dloadly-301.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dloadly-301
VITE_FIREBASE_STORAGE_BUCKET=dloadly-301.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=311277048392
VITE_FIREBASE_APP_ID=1:311277048392:web:377ec81519419ff7407e7d
VITE_FIREBASE_MEASUREMENT_ID=G-HQXTFFF5BK
```

## 🔐 **Security Notes**

1. **Google Drive Credentials:** Use the `google-drive-credentials.json` file content
2. **Generate new secrets** for production using: `openssl rand -base64 32`
3. **Never commit credentials** to git
4. **Use environment variables** only in deployment platforms

## 📋 **Deployment Steps**

### **1. Railway (Backend):**
1. Connect GitHub repository
2. Add all environment variables above
3. Deploy automatically

### **2. Vercel (Frontend):**
1. Import GitHub repository  
2. Set root directory to `frontend`
3. Add environment variables above
4. Deploy automatically

### **3. Update CORS:**
- Get Vercel URL
- Update `FRONTEND_URL` and `CORS_ORIGIN` in Railway
- Redeploy Railway

## ✅ **Ready for Production!**

After setting these variables, DLoadly will be fully functional with:
- ✅ Secure credential management
- ✅ Google Drive integration
- ✅ Email notifications  
- ✅ Firebase authentication
- ✅ Cross-platform compatibility
