import { createContext, useContext, useEffect, useState } from "react";
import { initSocket } from "../services/sockets";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);

  // Lấy userId từ AsyncStorage khi component mount
  useEffect(() => {
    const loadUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      console.log("Stored userId from AsyncStorage:", storedUserId);
      if (storedUserId) {
        setUserId(storedUserId);
        console.log("Loaded userId from AsyncStorage:", storedUserId);
      }
    };
    loadUserId();
  }, []);

  // Khởi tạo socket khi đã có userId
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
