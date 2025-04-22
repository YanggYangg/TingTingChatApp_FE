import { createContext, useContext, useEffect, useState } from "react";
import { initSocket } from "../services/sockets";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const initializeSocket = async () => {
      const userId = (await AsyncStorage.getItem("userId")) || "user123";
      if (!userId) {
        console.error("No userId found in AsyncStorage");
        return;
      }

      console.log("Connecting to cloud socket with userId:", userId);
      return userId;
    };

    const userId = initializeSocket();

    if (!userId) return;

    const socketInstance = initSocket(userId);
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
