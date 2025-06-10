
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyC55CMcwfMbjLLbnTqcnmcui3uxUJ5tF_A",
    authDomain: "deve-01.firebaseapp.com",
    projectId: "deve-01",
    storageBucket: "deve-01.firebasestorage.app",
    messagingSenderId: "734962267457",
    appId: "1:734962267457:web:3090f6a885b6f3a1305dc0",
    measurementId: "G-PHQ9249GNB"
};

const app = initializeApp(firebaseConfig);
const fAuth = getAuth(app)
const fStore = getFirestore(app)
const fStorage = getStorage(app)

export { app, fAuth, fStore, fStorage }