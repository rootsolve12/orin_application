// firebase/config.js
// Configuration sourced from the existing Flutter firebase_options.dart
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBkxJe6BTuhoOLKKLqrKJmXo2JBUebor_Q',
  authDomain: 'orin-application.firebaseapp.com',
  projectId: 'orin-application',
  storageBucket: 'orin-application.firebasestorage.app',
  messagingSenderId: '228833758197',
  appId: '1:228833758197:web:ded0fe9ad1dc5abbf76ebc',
  measurementId: 'G-DDY989M00V',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
