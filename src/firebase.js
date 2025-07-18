// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCG_ILizxr9vvXabZ9G8QJHNPRC9C1nHg0",
  authDomain: "cardtracker-d1427.firebaseapp.com",
  projectId: "cardtracker-d1427",
  storageBucket: "cardtracker-d1427.firebasestorage.app",
  messagingSenderId: "441011433114",
  appId: "1:441011433114:web:d48ba70f8d6bbcf3097923",
  measurementId: "G-Y5RFDT8BWH"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInAnonymously };