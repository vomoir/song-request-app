import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCiSfHTVzdcQHuPuEpElL2Uc0T7MvHsuzw",
  authDomain: "smokin-js-song-request.firebaseapp.com",
  projectId: "smokin-js-song-request",
  storageBucket: "smokin-js-song-request.firebasestorage.app",
  messagingSenderId: "481895819262",
  appId: "1:481895819262:web:66d5bd95e599d400b1c2af",
  measurementId: "G-5CHJ6ZEQV6"
};
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);

