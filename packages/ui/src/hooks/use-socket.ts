'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UseSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const { url = 'http://localhost:3001', autoConnect = true } = options;

  useEffect(() => {
    if (autoConnect && !socketRef.current) {
      socketRef.current = io(url, {
        transports: ['websocket'],
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, autoConnect]);

  return socketRef.current;
};