'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: string | null;
  reconnectAttempts: number;
  nextReconnectDelay: number;
}

interface WebSocketOptions {
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  reconnectBackoffMultiplier?: number;
  autoReconnect?: boolean;
}

export const useWebSocket = (url?: string, options: WebSocketOptions = {}) => {
  const {
    maxReconnectAttempts = 10,
    initialReconnectDelay = 1000, // 1 second
    maxReconnectDelay = 30000, // 30 seconds
    reconnectBackoffMultiplier = 1.5,
    autoReconnect = true
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    reconnectAttempts: 0,
    nextReconnectDelay: initialReconnectDelay
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const manualCloseRef = useRef(false);

  const calculateNextDelay = useCallback((currentAttempts: number): number => {
    const delay = initialReconnectDelay * Math.pow(reconnectBackoffMultiplier, currentAttempts);
    return Math.min(delay, maxReconnectDelay);
  }, [initialReconnectDelay, reconnectBackoffMultiplier, maxReconnectDelay]);

  const connect = useCallback(() => {
    if (!url || isUnmountedRef.current) return;

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }

        console.log('WebSocket connected:', url);
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
          nextReconnectDelay: initialReconnectDelay
        }));
      };

      ws.onmessage = (event) => {
        if (isUnmountedRef.current) return;

        setState(prev => ({
          ...prev,
          lastMessage: event.data
        }));
      };

      ws.onclose = (event) => {
        if (isUnmountedRef.current) return;

        console.log('WebSocket closed:', event.code, event.reason);
        
        wsRef.current = null;
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        // Only attempt reconnection if not manually closed and auto-reconnect is enabled
        if (!manualCloseRef.current && autoReconnect) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        setState(prev => ({
          ...prev,
          error: 'Connection failed',
          isConnecting: false,
          isConnected: false
        }));
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed',
        isConnecting: false,
        isConnected: false
      }));

      if (autoReconnect) {
        scheduleReconnect();
      }
    }
  }, [url, autoReconnect, initialReconnectDelay]);

  const scheduleReconnect = useCallback(() => {
    if (isUnmountedRef.current) return;

    setState(prev => {
      if (prev.reconnectAttempts >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        return {
          ...prev,
          error: `Failed to reconnect after ${maxReconnectAttempts} attempts`,
          isConnecting: false
        };
      }

      const nextDelay = calculateNextDelay(prev.reconnectAttempts);
      
      console.log(`Scheduling reconnection attempt ${prev.reconnectAttempts + 1} in ${nextDelay}ms`);

      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountedRef.current && autoReconnect) {
          connect();
        }
      }, nextDelay);

      return {
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1,
        nextReconnectDelay: nextDelay,
        isConnecting: true
      };
    });
  }, [maxReconnectAttempts, calculateNextDelay, connect, autoReconnect]);

  const disconnect = useCallback(() => {
    manualCloseRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
      nextReconnectDelay: initialReconnectDelay
    }));
  }, [initialReconnectDelay]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    manualCloseRef.current = false;
    setState(prev => ({
      ...prev,
      reconnectAttempts: 0,
      nextReconnectDelay: initialReconnectDelay,
      error: null
    }));

    connect();
  }, [connect, initialReconnectDelay]);

  const sendMessage = useCallback((message: string | object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageString);
      return true;
    }
    return false;
  }, []);

  // Initial connection
  useEffect(() => {
    if (url && autoReconnect) {
      manualCloseRef.current = false;
      connect();
    }

    return () => {
      isUnmountedRef.current = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, connect, autoReconnect]);

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastMessage: state.lastMessage,
    reconnectAttempts: state.reconnectAttempts,
    nextReconnectDelay: state.nextReconnectDelay,
    connect,
    disconnect,
    reconnect,
    sendMessage
  };
};