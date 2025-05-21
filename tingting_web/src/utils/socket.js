// utils/socket.js
import { io } from "socket.io-client";

const socket = io("http://184.73.0.29:3001", {
  withCredentials: true, // Cho phép gửi cookie nếu cần
});

export default socket;
