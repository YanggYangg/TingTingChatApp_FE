import { generateToken, messaging  } from "../notifications/firebase";
import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { useLocation } from "react-router-dom";

const FCMHandler = () => {
    const location = useLocation();
    useEffect(() => {
        const userId = localStorage.getItem("userId");
        if (userId) {
          generateToken(userId);
        }
    
        const unsubscribe = onMessage(messaging, (payload) => {
          const { title, body } = payload?.notification || {};
          if (location.pathname !== "/chat") {
            toast.info(`${title}: ${body}`, {
              position: "top-right",
              autoClose: 3000,
            });
          }
        });
    
        return () => unsubscribe();
      }, [location.pathname]);
    
      return null;
};

export default FCMHandler;