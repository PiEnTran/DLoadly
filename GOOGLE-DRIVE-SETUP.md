# 🚀 Google Drive Setup Guide for DLoadly

## 📋 Overview
This guide will help you set up Google Drive integration for DLoadly to automatically upload downloaded files to users' Google Drive folders.

## 🔧 Step-by-Step Setup

### **Step 1: Create Google Cloud Project**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project:**
   - Click "Select a project" → "New Project"
   - Project name: `DLoadly` (or any name you prefer)
   - Click "Create"

### **Step 2: Enable Google Drive API**

1. **Navigate to APIs & Services:**
   - In the left sidebar: "APIs & Services" → "Library"

2. **Enable Google Drive API:**
   - Search for "Google Drive API"
   - Click on "Google Drive API"
   - Click "Enable"

### **Step 3: Create Service Account**

1. **Go to Credentials:**
   - Left sidebar: "APIs & Services" → "Credentials"

2. **Create Service Account:**
   - Click "Create Credentials" → "Service Account"
   - Service account name: `dloadly-service`
   - Service account ID: `dloadly-service` (auto-generated)
   - Description: `Service account for DLoadly file uploads`
   - Click "Create and Continue"

3. **Grant Roles:**
   - Skip role assignment (not needed for this use case)
   - Click "Continue" → "Done"

### **Step 4: Generate Service Account Key**

1. **Find Your Service Account:**
   - In Credentials page, find your service account
   - Click on the service account email

2. **Create Key:**
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON" format
   - Click "Create"
   - **Download the JSON file** (keep it secure!)

### **Step 5: Create Google Drive Folder**

1. **Create Main Folder:**
   - Go to https://drive.google.com/
   - Create a new folder named "DLoadly Files"
   - Right-click folder → "Share"

2. **Share with Service Account:**
   - Add the service account email (from JSON file: `client_email`)
   - Set permission to "Editor"
   - Uncheck "Notify people"
   - Click "Share"

3. **Get Folder ID:**
   - Open the folder in Google Drive
   - Copy the folder ID from URL:
   ```
   https://drive.google.com/drive/folders/1ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
                                          ↑ This is your folder ID
   ```

### **Step 6: Configure DLoadly**

1. **Open the downloaded JSON file** and copy its content

2. **Update backend/.env file:**
   ```env
   GOOGLE_DRIVE_ENABLED=true
   GOOGLE_DRIVE_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
   GOOGLE_DRIVE_FOLDER_ID=1ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
   ```

3. **Replace the placeholder values:**
   - `GOOGLE_DRIVE_CREDENTIALS`: Paste the entire JSON content (as one line)
   - `GOOGLE_DRIVE_FOLDER_ID`: Your folder ID from Step 5

## 🧪 Testing

### **Test 1: Server Startup**
```bash
cd backend
npm start
```

**Expected output:**
```
✅ Google Drive: Connected
☁️ Google Drive: Configured
```

### **Test 2: File Upload**
1. Download a video through DLoadly
2. Check Google Drive folder
3. Verify user-specific folder was created
4. Confirm file was uploaded

## 🔒 Security Notes

- **Keep JSON credentials secure** - never commit to git
- **Use environment variables** in production
- **Rotate keys periodically** for security
- **Monitor API usage** in Google Cloud Console

## 🚨 Troubleshooting

### **"Google Drive service not initialized"**
- Check if credentials JSON is valid
- Verify folder ID is correct
- Ensure service account has access to folder

### **"Permission denied"**
- Verify service account email is shared with folder
- Check service account has "Editor" permission
- Confirm folder ID is correct

### **"API not enabled"**
- Ensure Google Drive API is enabled in Google Cloud Console
- Wait a few minutes after enabling API

## 📊 Production Deployment

For production (Vercel + Railway):

1. **Add environment variables to Railway:**
   ```
   GOOGLE_DRIVE_ENABLED=true
   GOOGLE_DRIVE_CREDENTIALS={"type":"service_account",...}
   GOOGLE_DRIVE_FOLDER_ID=your_folder_id
   ```

2. **Test in production environment**

3. **Monitor usage and quotas**

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] Service account created
- [ ] JSON key downloaded
- [ ] Google Drive folder created
- [ ] Folder shared with service account
- [ ] Environment variables updated
- [ ] Server starts without errors
- [ ] Test upload works
- [ ] User folders created automatically

## 🎉 Success!

Once setup is complete, DLoadly will:
- ✅ Automatically create user-specific folders
- ✅ Upload downloaded files to Google Drive
- ✅ Share folders with requesting users
- ✅ Provide direct Google Drive links
- ✅ Handle permissions automatically

**Your DLoadly is now fully integrated with Google Drive!** 🚀
