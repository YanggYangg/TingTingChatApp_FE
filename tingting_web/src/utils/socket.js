// utils/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  withCredentials: true, // Cho phép gửi cookie nếu cần
});

export default socket;
