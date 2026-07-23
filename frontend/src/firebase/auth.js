// firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

/**
 * Create a new user with email & password, then
 * create their Firestore user document.
 */
export const signUpWithEmail = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name in Firebase Auth
  await updateProfile(user, { displayName });

  // Create Firestore user document
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    role: 'participant',
    createdAt: serverTimestamp(),
    onboardingComplete: false,
    emailVerified: true,
    skills: [],
    eventsJoined: 0,
    certificates: 0,
    communities: 0,
    skillsEarned: 0,
  });

  return user;
};

/**
 * Sign in with email & password.
 */
export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign in with Google popup.
 * Creates user doc on first sign-in.
 */
export const loginWithGoogle = async () => {
  let userCredential;

  if (Capacitor.isNativePlatform()) {
    // Initialize if needed (usually handled by capacitor, but safe to call)
    GoogleAuth.initialize();
    
    // Trigger native Android Google Account bottom sheet
    const googleUser = await GoogleAuth.signIn();
    
    // Create Firebase credential securely from idToken
    const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
    
    // Sign in to Firebase
    userCredential = await signInWithCredential(auth, credential);
  } else {
    // Standard web popup
    userCredential = await signInWithPopup(auth, googleProvider);
  }

  const user = userCredential.user;

  // Check if user doc already exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'participant',
      createdAt: serverTimestamp(),
      onboardingComplete: false,
      skills: [],
      eventsJoined: 0,
      certificates: 0,
      communities: 0,
      skillsEarned: 0,
    });
  }

  return user;
};

/**
 * Sign out.
 */
export const logout = async () => {
  await signOut(auth);
};

/**
 * Send a password reset email.
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Subscribe to auth state changes.
 * Returns unsubscribe function.
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
