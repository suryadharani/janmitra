/**
 * JanMitra Firebase Configuration & Credentials Provider
 * Note: Never hardcode passwords or private production secret keys here.
 * The configuration below connects to the JanMitra Firebase Project.
 */

// Firebase Configuration template
export const firebaseConfig = {
  apiKey: window.JANMITRA_FIREBASE_API_KEY || "AIzaSyJanMitraSparkFreeTierPlaceholder",
  authDomain: "janmitra-app.firebaseapp.com",
  projectId: "janmitra-app",
  storageBucket: "janmitra-app.firebasestorage.app",
  messagingSenderId: "100000000000",
  appId: "1:100000000000:web:janmitraapp"
};

// Security Mapping: Username to authorized recovery email
export const USERNAME_MAP = {
  'janmitra': 'srigiribhuvaneshwaridevi@gmail.com'
};

export const DEFAULT_RECOVERY_EMAIL = 'srigiribhuvaneshwaridevi@gmail.com';
