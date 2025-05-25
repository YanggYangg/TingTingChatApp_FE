// socket.ts
import { io } from "socket.io-client";

const socket = io("http://192.168.1.9:3001", {
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
