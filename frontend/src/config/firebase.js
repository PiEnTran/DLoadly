// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDZxG9LmNdZf69uZ4ttjH7RlY5UoPamTBI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dloadly-301.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dloadly-301",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dloadly-301.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "311277048392",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:311277048392:web:377ec81519419ff7407e7d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HQXTFFF5BK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
