import { createContext, useContext, useEffect, useState } from "react";
import { initSocket } from "../services/sockets";

const SocketContext = createContext(null);

export const SocketProvider = ({ userId, children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = initSocket(userId);
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
