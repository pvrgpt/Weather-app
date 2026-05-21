// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration (PASTE YOURS HERE FROM STEP 0)
const firebaseConfig = {
    apiKey: "AIzaSyCJGqW6781mz3KTwILFhOzatkiNNxavcjw",
    authDomain: "mumbai-weather-app.firebaseapp.com",
    projectId: "mumbai-weather-app",
    storageBucket: "mumbai-weather-app.firebasestorage.app",
    messagingSenderId: "345320590893",
    appId: "1:345320590893:web:765c47d5cd6ab402c232a4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // If you plan to upload images

// Sign in user anonymously
signInAnonymously(auth)
    .then(() => {
        console.log("User signed in anonymously");
    })
    .catch((error) => {
        console.error("Error signing in anonymously:", error);
    });

export { db, auth, storage };