import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzCDCwB3EUWhzcn88i2YwvTU_MU6r9O7I",
  authDomain: "flashcard-ai-basicproject4.firebaseapp.com",
  projectId: "flashcard-ai-basicproject4",
  storageBucket: "flashcard-ai-basicproject4.firebasestorage.app",
  messagingSenderId: "308803798862",
  appId: "1:308803798862:web:7a03b35a2b42373f3c001f",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất database (db) để các màn hình khác (như Login, Home) có thể gọi được
export const db = getFirestore(app);
