import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRfV_9fCv2roOInuVrb7G_9IG6DPlT0a4",
  authDomain: "mishbah-e8e33.firebaseapp.com",
  projectId: "mishbah-e8e33",
  storageBucket: "mishbah-e8e33.firebasestorage.app",
  messagingSenderId: "896644483497",
  appId: "1:896644483497:web:432f56dac2ca92566c9cb8",
  measurementId: "G-DKLWKC0Z9Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, provider, db, storage, analytics };
