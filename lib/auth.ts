import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

export const createAccount = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update the user's display name
    await updateProfile(firebaseUser, {
      displayName: displayName
    });

    // Create user document in Firestore
    const userData: Omit<User, 'uid'> = {
      email: firebaseUser.email!,
      displayName: displayName,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      lastSeen: new Date(),
      isOnline: true
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    });

    return {
      uid: firebaseUser.uid,
      ...userData
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signInUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Update user's online status
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      isOnline: true,
      lastSeen: serverTimestamp()
    }, { merge: true });

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: firebaseUser.displayName || 'Anonymous',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      lastSeen: new Date(),
      isOnline: true
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    if (auth.currentUser) {
      // Update user's online status before signing out
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        isOnline: false,
        lastSeen: serverTimestamp()
      }, { merge: true });
    }
    
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};