import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const isDevelopment = process.env.NODE_ENV === 'development';

export const createUserDocument = async (uid: string, userData: any) => {
  if (!uid) {
    console.error('No UID provided for user document');
    return false;
  }

  // In development, store user data in localStorage
  if (isDevelopment) {
    try {
      const mockDb = JSON.parse(localStorage.getItem('mockUserDb') || '{}');
      mockDb[uid] = {
        ...userData,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('mockUserDb', JSON.stringify(mockDb));
      console.log('Development mode: User document stored in localStorage:', mockDb[uid]);
      return true;
    } catch (error) {
      console.error('Error storing mock user document:', error);
      return false;
    }
  }

  // Production mode with Firestore
  if (!db) {
    console.error('Firestore is not initialized');
    return false;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userDataWithTimestamp = {
      ...userData,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userRef, userDataWithTimestamp, { merge: true });
    return true;
  } catch (error) {
    console.error('Error creating/updating user document:', error);
    return false;
  }
};

export const getUserDocument = async (uid: string) => {
  if (!uid) {
    console.error('No UID provided for getting user document');
    return null;
  }

  // In development, get user data from localStorage
  if (isDevelopment) {
    try {
      const mockDb = JSON.parse(localStorage.getItem('mockUserDb') || '{}');
      const userData = mockDb[uid];
      if (userData) {
        console.log('Development mode: Retrieved user document from localStorage:', userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving mock user document:', error);
      return null;
    }
  }

  // Production mode with Firestore
  if (!db) {
    console.error('Firestore is not initialized');
    return null;
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (error) {
    console.error('Error fetching user document:', error);
    return null;
  }
};
