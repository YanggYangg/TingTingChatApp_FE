import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const CloudSocketContext = createContext();

export function CloudSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const socketInstance = io('http://localhost:3000', {
        query: { userId },
      });
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Cloud socket connected:', socketInstance.id);
      });
      socketInstance.on('connect_error', (error) => {
        console.error('Cloud socket connection error:', error);
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, []);

  return (
    <CloudSocketContext.Provider value={socket}>
      {children}
    </CloudSocketContext.Provider>
  );
}

export function useCloudSocket() {
  return useContext(CloudSocketContext);
}