// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken } from "firebase/messaging";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8fnb12ST1wm-nPXWcNerKuRkFxIHmorQ",
  authDomain: "tingtingchatapp.firebaseapp.com",
  projectId: "tingtingchatapp",
  storageBucket: "tingtingchatapp.firebasestorage.app",
  messagingSenderId: "717017584828",
  appId: "1:717017584828:web:a341539f60f000afd82cb9",
  measurementId: "G-L2T4KXWY6Q"


};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const messaging = getMessaging(app);
// Hàm gửi token về backend
const sendTokenToBackend = async (userId, fcmToken) => {
  try {
    await fetch("http://100.28.46.80:3003/userFcmToken/saveUserTokenFcm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, fcmToken }),
    });
    console.log("[✓] Token sent to backend");
  } catch (error) {
    console.error("[!] Failed to send token:", error);
  }
};

//Xin quyền nhận thông báo từ trình duyệt
export const generateToken = async (userId) => {
  const permission = await Notification.requestPermission();
  /*
    granted: người dùng đã đồng ý nhận thông báo
    denied: người dùng đã từ chối nhận thông báo
    */
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey:
        "BIld-ZXewOZTYl8eIvMtZ0Ngm9ZBfC05tKnbCOj7GpSwZOPzdWWrTiaKUJ1Qy21PPU7wLBFFB99Lz7HcZhSdd1U",
    });
    //console.log("Token config FCM :", token);
    if (token && userId) {
      console.log("FCM Token:", token);
      await sendTokenToBackend(userId, token);
      //return token;
      console.log("Token sent to backend successfully");
    } else {
      console.warn("Missing token or userId");
    }
  }
  console.log("Permission Notifications", permission);
};
