import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBTYMHNroOD-OYqaxHrYItjUZqu3zupyNA",
  authDomain: "smartbuss-8c1cb.firebaseapp.com",
  databaseURL: "https://smartbuss-8c1cb-default-rtdb.firebaseio.com",
  projectId: "smartbuss-8c1cb",
  storageBucket: "smartbuss-8c1cb.appspot.com",
  messagingSenderId: "470352021450",
  appId: "1:470352021450:android:c31d9e314ce40aae85b133",
  measurementId: "G-QL1C4WBLKQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const database = getDatabase(app);




