import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import { Platform } from 'react-native';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = Object.values(config).every(Boolean)
  ? (getApps().length ? getApp() : initializeApp(config))
  : null;

// The Firebase umbrella package uses web declarations for its native runtime export.
const { getReactNativePersistence } = firebaseAuth as typeof firebaseAuth & {
  getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
};

function configureAuth() {
  if (!app) return null;
  if (Platform.OS === 'web') return firebaseAuth.getAuth(app);
  try {
    return firebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/already-initialized') throw error;
    return firebaseAuth.getAuth(app);
  }
}

export const auth = configureAuth();
