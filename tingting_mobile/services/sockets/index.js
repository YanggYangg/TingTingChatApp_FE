import { io } from "socket.io-client";
export const initSocket = (userId) => {
  return io("http://172.16.0.28:5000", {
    query: { userId },
    transports: ["websocket"], // quan trọng để tránh fallback polling
  });
};
