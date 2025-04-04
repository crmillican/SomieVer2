import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './use-websocket';
import { useAuth } from './use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Types for sync data
export interface SyncData {
  businessProfile?: any;
  influencerProfile?: any;
  offers?: any[];
  claims?: any[];
  notifications?: any[];
  socialPlatforms?: any[];
  deliverables?: any[];
  success: boolean;
  timestamp?: string;
}

// Context type
interface SyncContextType {
  lastSyncTime: Date | null;
  syncData: SyncData | null;
  isSyncing: boolean;
  syncError: Error | null;
  requestSync: () => void;
  syncStatus: string;
}

// Create context with default values
const SyncContext = createContext<SyncContextType>({
  lastSyncTime: null,
  syncData: null,
  isSyncing: false,
  syncError: null,
  requestSync: () => {},
  syncStatus: 'idle',
});

export const SyncProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user } = useAuth();
  const { requestSync, state } = useWebSocket();
  const queryClient = useQueryClient();
  
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('idle');

  // Function to trigger a sync
  const triggerSync = useCallback(() => {
    if (!user) return;
    
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncError(null);
    requestSync();
  }, [user, requestSync]);

  // Handle sync data received from WebSocket
  const handleSyncData = useCallback((data: SyncData) => {
    setIsSyncing(false);
    setLastSyncTime(new Date());
    setSyncData(data);
    setSyncStatus('success');

    // Update React Query cache with sync data
    if (data.offers) {
      queryClient.setQueryData(['offers'], data.offers);
    }
    
    if (data.claims) {
      queryClient.setQueryData(['claims'], data.claims);
    }
    
    if (data.notifications) {
      queryClient.setQueryData(['notifications'], data.notifications);
    }
    
    if (data.businessProfile) {
      queryClient.setQueryData(['businessProfile'], data.businessProfile);
    }
    
    if (data.influencerProfile) {
      queryClient.setQueryData(['influencerProfile'], data.influencerProfile);
    }
    
    if (data.socialPlatforms) {
      queryClient.setQueryData(['socialPlatforms'], data.socialPlatforms);
    }
    
    if (data.deliverables) {
      queryClient.setQueryData(['deliverables'], data.deliverables);
    }
  }, [queryClient]);

  // Listen for sync data events from WebSocket
  useEffect(() => {
    const handleSyncDataEvent = (event: CustomEvent) => {
      handleSyncData(event.detail);
    };

    window.addEventListener('sync-data-received', handleSyncDataEvent as EventListener);
    
    return () => {
      window.removeEventListener('sync-data-received', handleSyncDataEvent as EventListener);
    };
  }, [handleSyncData]);

  // Listen for entity update events from WebSocket
  useEffect(() => {
    const handleEntityUpdate = (event: CustomEvent) => {
      const { entityType, action, data } = event.detail;
      
      console.log(`Processing entity update: ${entityType} ${action}`);
      
      // Update the appropriate cache based on entity type
      switch (entityType) {
        case 'offer':
          if (action === 'create' || action === 'update') {
            queryClient.setQueryData(['offers', data.id], data);
            
            // Also update the list if we have it cached
            const offers = queryClient.getQueryData<any[]>(['offers']) || [];
            if (action === 'create') {
              if (!offers.some(o => o.id === data.id)) {
                queryClient.setQueryData(['offers'], [...offers, data]);
              }
            } else if (action === 'update') {
              queryClient.setQueryData(
                ['offers'], 
                offers.map(o => o.id === data.id ? data : o)
              );
            }
          } else if (action === 'delete') {
            queryClient.removeQueries({ queryKey: ['offers', data.id] });
            
            // Also update the list if we have it cached
            const offers = queryClient.getQueryData<any[]>(['offers']) || [];
            queryClient.setQueryData(
              ['offers'], 
              offers.filter(o => o.id !== data.id)
            );
          }
          break;
          
        case 'claim':
          if (action === 'create' || action === 'update') {
            queryClient.setQueryData(['claims', data.id], data);
            
            // Also update the list if we have it cached
            const claims = queryClient.getQueryData<any[]>(['claims']) || [];
            if (action === 'create') {
              if (!claims.some(c => c.id === data.id)) {
                queryClient.setQueryData(['claims'], [...claims, data]);
              }
            } else if (action === 'update') {
              queryClient.setQueryData(
                ['claims'], 
                claims.map(c => c.id === data.id ? data : c)
              );
            }
          }
          break;
          
        case 'message':
          if (action === 'create') {
            // Update the claim's messages list
            const claimId = data.claimId;
            const messages = queryClient.getQueryData<any[]>(['messages', claimId]) || [];
            if (!messages.some(m => m.id === data.id)) {
              queryClient.setQueryData(['messages', claimId], [...messages, data]);
            }
          }
          break;
          
        case 'notification':
          if (action === 'create') {
            // Update notifications list
            const notifications = queryClient.getQueryData<any[]>(['notifications']) || [];
            if (!notifications.some(n => n.id === data.id)) {
              queryClient.setQueryData(['notifications'], [...notifications, data]);
            }
          }
          break;
          
        default:
          console.log(`No handler for entity type: ${entityType}`);
      }
    };

    window.addEventListener('entity-update', handleEntityUpdate as EventListener);
    
    return () => {
      window.removeEventListener('entity-update', handleEntityUpdate as EventListener);
    };
  }, [queryClient]);

  // Request sync when user changes or WebSocket connects
  useEffect(() => {
    if (user && state === 'connected') {
      // Initial sync when WebSocket connects
      triggerSync();
    }
  }, [user, state, triggerSync]);

  // Create context value
  const contextValue: SyncContextType = {
    lastSyncTime,
    syncData,
    isSyncing,
    syncError,
    requestSync: triggerSync,
    syncStatus,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

// Hook to use sync context
export const useSync = () => useContext(SyncContext);

// Helper hook to get data with sync support
export function useSyncQuery<T>(queryKey: string[], fetcher?: () => Promise<T>) {
  const { requestSync } = useSync();
  
  // Create a query options object
  const queryOptions = {
    queryKey,
    queryFn: fetcher || (() => Promise.reject("No fetcher provided") as Promise<T>),
    refetchOnWindowFocus: false,
    retry: false
  };

  // Handle error via useEffect instead of using unsupported onSettled
  const query = useQuery<T>(queryOptions);
  
  useEffect(() => {
    if (query.error) {
      console.error(`Query error for ${queryKey.join('/')}:`, query.error);
      // Try to sync data on error as fallback
      requestSync();
    }
  }, [query.error, queryKey, requestSync]);
  
  return query;
}