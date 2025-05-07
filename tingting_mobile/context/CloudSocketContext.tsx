import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CloudSocketContextType {
  socket: Socket | null;
}

const CloudSocketContext = createContext<CloudSocketContextType>({
  socket: null,
});

export const CloudSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const initializeSocket = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        console.error("No userId found in AsyncStorage");
        return;
      }

      console.log("Connecting to cloud socket with userId:", userId);
      return userId;
    };

    const userId = initializeSocket();

    const socketInstance = io("http://192.168.1.8:3000", {
      query: { userId },
    });

    socketInstance.on("connect", () => {
      console.log("Cloud socket connected (mobile):", socketInstance.id);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Cloud socket connection error (mobile):", error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      console.log("Cloud socket disconnected (mobile)");
    };
  }, []);

  return (
    <CloudSocketContext.Provider value={{ socket }}>
      {children}
    </CloudSocketContext.Provider>
  );
};

export const useCloudSocket = () => useContext(CloudSocketContext);
