import { createContext, useContext, useEffect, useState } from "react";
import { initSocket } from "../services/sockets";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  console.log("userId socket", userId);
  useEffect(() => {
    if (userId) {
      const userLoad = localStorage.getItem("userId");
      if (userLoad) {
        setUserId(userLoad);
        console.log("userId", userLoad);
      } else {
        localStorage.setItem("userId", userId);
      }
    } else {
      localStorage.removeItem("userId");
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = initSocket(userId);
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, userId, setUserId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
