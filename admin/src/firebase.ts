import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaX3-Motoi9ZXbTregsIZC1yt8BKG4KFw",
  authDomain: "gorarch-60f19.firebaseapp.com",
  projectId: "gorarch-60f19",
  storageBucket: "gorarch-60f19.firebasestorage.app",
  messagingSenderId: "751855915931",
  appId: "1:751855915931:web:c9b00445d44c178735c73e",
  measurementId: "G-MYQS69MP8D",
  databaseURL: "https://gorarch-60f19-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

export default app;