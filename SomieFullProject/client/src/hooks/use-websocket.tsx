import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import axios from 'axios';

// Define WebSocket connection states
export enum WebSocketState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}

// Types for messages
export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

export interface EntityChange {
  type: string; // 'offer', 'claim', etc.
  action: string; // 'create', 'update', 'delete'
  entityId?: number;
  data: any;
}

// Context type
interface WebSocketContextType {
  state: WebSocketState;
  sendMessage: (message: WebSocketMessage) => void;
  requestSync: () => void;
  sendChanges: (changes: EntityChange[]) => void;
  lastError: Error | null;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  state: WebSocketState.DISCONNECTED,
  sendMessage: () => {},
  requestSync: () => {},
  sendChanges: () => {},
  lastError: null,
});

export const WebSocketProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const auth = useAuth();
  const token = auth.token;
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [lastError, setLastError] = useState<Error | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCount = useRef(0);
  const MAX_RECONNECT_COUNT = 5;
  const BASE_RECONNECT_TIME = 2000; // Start with 2 seconds
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!token) {
      console.log('No auth token available, cannot connect to WebSocket');
      return;
    }

    // Close existing connection if any
    if (socket.current) {
      socket.current.close();
    }

    setState(WebSocketState.CONNECTING);

    try {
      // Add token to WS URL - construct it based on current window location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?token=${token}`;
      console.log('Connecting to WebSocket at:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      socket.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setState(WebSocketState.CONNECTED);
        reconnectCount.current = 0;
        clearTimeout(reconnectTimeoutRef.current!);
        startPingInterval();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setLastError(new Error('WebSocket connection error'));
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setState(WebSocketState.DISCONNECTED);
        clearInterval(pingIntervalRef.current!);
        
        // Schedule reconnect unless it was a clean close
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setLastError(error instanceof Error ? error : new Error('Failed to create WebSocket'));
      scheduleReconnect();
    }
  }, [token]);

  // Handle reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectCount.current >= MAX_RECONNECT_COUNT) {
      console.log('Max reconnect attempts reached');
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = BASE_RECONNECT_TIME * Math.pow(1.5, reconnectCount.current);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectCount.current + 1})`);
    
    setState(WebSocketState.RECONNECTING);
    reconnectCount.current += 1;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // Start ping interval to keep connection alive
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'ping',
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000); // Send ping every 30 seconds
  }, []);

  // Send a message to the server
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message, WebSocket is not open');
      // Handle offline mode - could queue messages for later
    }
  }, []);

  // Request sync from server
  const requestSync = useCallback(() => {
    if (state === WebSocketState.CONNECTED) {
      sendMessage({ type: 'sync_request' });
    } else {
      console.log('WebSocket not connected, using HTTP fallback for sync');
      // Fallback to HTTP sync if WebSocket is not available
      axios.get('/api/sync', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        // Handle sync response same as WebSocket
        handleMessage({
          type: 'sync_response',
          data: response.data
        });
      })
      .catch(error => {
        console.error('HTTP sync fallback failed:', error);
        setLastError(new Error('Sync failed'));
      });
    }
  }, [state, token, sendMessage]);

  // Send entity changes
  const sendChanges = useCallback((changes: EntityChange[]) => {
    if (changes.length === 0) return;

    if (state === WebSocketState.CONNECTED) {
      sendMessage({
        type: 'changes',
        data: { changes }
      });
    } else {
      console.log('WebSocket not connected, using HTTP fallback for changes');
      // Fallback to HTTP for sending changes
      axios.post('/api/sync/changes', { changes }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .catch(error => {
        console.error('HTTP changes fallback failed:', error);
      });
    }
  }, [state, token, sendMessage]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    // console.log('Received WebSocket message:', message.type);

    switch (message.type) {
      case 'connected':
        // Connection confirmation from server
        console.log('Server confirmed WebSocket connection');
        break;

      case 'pong':
        // Server responded to our ping
        // console.log('Received pong from server');
        break;

      case 'sync_response':
        // Handle sync data from server
        console.log('Received sync data from server');
        if (message.data) {
          // Update local state with sync data
          // This would be handled by the sync hook
          window.dispatchEvent(new CustomEvent('sync-data-received', { 
            detail: message.data 
          }));
        }
        break;

      case 'update':
        // Handle entity update
        if (message.data) {
          console.log('Received entity update:', 
            message.data.entityType, 
            message.data.action
          );
          
          // Dispatch event for entity updates
          window.dispatchEvent(new CustomEvent('entity-update', { 
            detail: message.data 
          }));
        }
        break;

      case 'notification':
        // Handle notification
        console.log('Received notification:', message.data);
        window.dispatchEvent(new CustomEvent('notification-received', { 
          detail: message.data 
        }));
        break;

      case 'error':
        // Handle error from server
        console.error('Server reported WebSocket error:', message.data?.message);
        setLastError(new Error(message.data?.message || 'Unknown WebSocket error'));
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }, []);

  // Connect when token changes
  useEffect(() => {
    if (token) {
      connect();
    } else {
      // Disconnect if token is removed
      if (socket.current) {
        socket.current.close();
        socket.current = null;
      }
      setState(WebSocketState.DISCONNECTED);
    }

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [token, connect]);

  // Subscribe to visibility changes to reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token) {
        if (socket.current?.readyState !== WebSocket.OPEN) {
          console.log('Document became visible, reconnecting WebSocket');
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, connect]);

  // Create context value
  const contextValue: WebSocketContextType = {
    state,
    sendMessage,
    requestSync,
    sendChanges,
    lastError,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);