import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updatePassword,
  updateEmail,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwq4ttDc1e3Q8ohL8US_PxpCIu8IyGPV0",
  authDomain: "prownie-next.firebaseapp.com",
  projectId: "prownie-next",
  storageBucket: "prownie-next.firebasestorage.app",
  messagingSenderId: "437889455728",
  appId: "1:437889455728:web:50d3c4f8c603b4b46706b5",
  measurementId: "G-V2S8YLWHH3",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
  app,
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getFirestore,
  db,
  addDoc,
  collection,
  updateProfile,
  getDocs,
  updatePassword,
  updateEmail,
  setDoc,
  doc,
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  deleteUser,
};
export default app;
export { firebaseConfig };
