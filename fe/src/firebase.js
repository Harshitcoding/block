
import { initializeApp } from "firebase/app";
import {getStorage} from 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyAy-mrIT5J1F9wuBtlrfNR2AWpTGgetfbQ",
    authDomain: "blog-ab005.firebaseapp.com",
    projectId: "blog-ab005",
    storageBucket: "blog-ab005.appspot.com",
    messagingSenderId: "500582038972",
    appId: "1:500582038972:web:f5123e1f336af7bc5dffb9"
  };

  const app = initializeApp(firebaseConfig);
export const storage = getStorage(app)