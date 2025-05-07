import { io } from "socket.io-client";
export const initSocket = (userId) => {
  return io("http://192.168.1.6:5000", {
    query: { userId },
    transports: ["websocket"], // quan trọng để tránh fallback polling
  });
};
