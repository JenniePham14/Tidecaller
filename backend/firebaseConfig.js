import { initializeApp } from "firebase/app";
import {getAuth} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyCuU3phkpCxpQa3UO4a0PBnkt2tWuR6DRg",
  authDomain: "tidecaller-app.firebaseapp.com",
  projectId: "tidecaller-app",
  storageBucket: "tidecaller-app.firebasestorage.app",
  messagingSenderId: "793155331990",
  appId: "1:793155331990:web:fa5484cc56853c9a259fb7",
  measurementId: "G-XVTVVGLXRH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

//continue with firestore data base
const firestore = getFirestore(app);

export {app, auth, firebaseConfig, firestore};