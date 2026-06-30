import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0534684823",
  appId: "1:843964948298:web:23a4b2912463bf5ce0ebb3",
  apiKey: "AIzaSyDD2uRqnnR4pMlyiKUqV9xL9vpj6SBO_EI",
  authDomain: "gen-lang-client-0534684823.firebaseapp.com",
  storageBucket: "gen-lang-client-0534684823.firebasestorage.app",
  messagingSenderId: "843964948298"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use custom Firestore database ID
export const db = getFirestore(app, "ai-studio-0df6fbb9-0f50-4127-8e75-55bd81b8891c");
