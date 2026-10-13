// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// SUBSTITUA ESTE BLOCO PELO SEU CÓDIGO DO FIREBASE!
// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxwC-M_EIvN1KFVd_plM6ewJA20Nr93ew",
  authDomain: "controle-financeiro-9e5aa.firebaseapp.com",
  projectId: "controle-financeiro-9e5aa",
  storageBucket: "controle-financeiro-9e5aa.firebasestorage.app",
  messagingSenderId: "427522285169",
  appId: "1:427522285169:web:53e431e572e2bf255505d0"
};

// ... (suas configurações do firebaseConfig aqui em cima) ...

// Deixe apenas UMA vez a linha do app:
const app = initializeApp(firebaseConfig);

// E logo abaixo a linha do db:
export const db = getFirestore(app);