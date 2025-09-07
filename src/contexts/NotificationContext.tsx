'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';

export interface NotificationBadge {
  id: string;
  type: 'count' | 'status' | 'new' | 'live';
  value: number | string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
  persistent?: boolean;
  viewedAt?: Date;
  expiresAt?: Date;
}

interface NotificationState {
  badges: Record<string, NotificationBadge>;
  viewedItems: Set<string>;
}

type NotificationAction = 
  | { type: 'SET_BADGE'; payload: { itemId: string; badge: NotificationBadge } }
  | { type: 'REMOVE_BADGE'; payload: { itemId: string } }
  | { type: 'MARK_VIEWED'; payload: { itemId: string } }
  | { type: 'UPDATE_BADGE_COUNT'; payload: { itemId: string; count: number } }
  | { type: 'SET_LIVE_STATUS'; payload: { itemId: string; isLive: boolean } }
  | { type: 'CLEAR_EXPIRED'; payload: {} };

const initialState: NotificationState = {
  badges: {},
  viewedItems: new Set()
};

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_BADGE': {
      const { itemId, badge } = action.payload;
      return {
        ...state,
        badges: {
          ...state.badges,
          [itemId]: badge
        }
      };
    }
    
    case 'REMOVE_BADGE': {
      const { itemId } = action.payload;
      const { [itemId]: removed, ...remainingBadges } = state.badges;
      return {
        ...state,
        badges: remainingBadges
      };
    }
    
    case 'MARK_VIEWED': {
      const { itemId } = action.payload;
      const badge = state.badges[itemId];
      
      // If it's a 'new' type badge and not persistent, remove it
      if (badge && badge.type === 'new' && !badge.persistent) {
        const { [itemId]: removed, ...remainingBadges } = state.badges;
        return {
          ...state,
          badges: remainingBadges,
          viewedItems: new Set([...state.viewedItems, itemId])
        };
      }
      
      // Mark as viewed but keep the badge
      return {
        ...state,
        viewedItems: new Set([...state.viewedItems, itemId])
      };
    }
    
    case 'UPDATE_BADGE_COUNT': {
      const { itemId, count } = action.payload;
      const existingBadge = state.badges[itemId];
      
      if (!existingBadge || count <= 0) {
        const { [itemId]: removed, ...remainingBadges } = state.badges;
        return {
          ...state,
          badges: remainingBadges
        };
      }
      
      return {
        ...state,
        badges: {
          ...state.badges,
          [itemId]: {
            ...existingBadge,
            value: count
          }
        }
      };
    }
    
    case 'SET_LIVE_STATUS': {
      const { itemId, isLive } = action.payload;
      
      if (isLive) {
        return {
          ...state,
          badges: {
            ...state.badges,
            [itemId]: {
              id: `${itemId}-live`,
              type: 'live',
              value: '',
              color: 'green',
              persistent: true
            }
          }
        };
      } else {
        const { [itemId]: removed, ...remainingBadges } = state.badges;
        return {
          ...state,
          badges: remainingBadges
        };
      }
    }
    
    case 'CLEAR_EXPIRED': {
      const now = new Date();
      const validBadges = Object.entries(state.badges).reduce((acc, [itemId, badge]) => {
        if (!badge.expiresAt || badge.expiresAt > now) {
          acc[itemId] = badge;
        }
        return acc;
      }, {} as Record<string, NotificationBadge>);
      
      return {
        ...state,
        badges: validBadges
      };
    }
    
    default:
      return state;
  }
}

interface NotificationContextType {
  state: NotificationState;
  setBadge: (itemId: string, badge: NotificationBadge) => void;
  removeBadge: (itemId: string) => void;
  markAsViewed: (itemId: string) => void;
  updateBadgeCount: (itemId: string, count: number) => void;
  setLiveStatus: (itemId: string, isLive: boolean) => void;
  getBadge: (itemId: string) => NotificationBadge | undefined;
  isViewed: (itemId: string) => boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  
  // Clear expired badges every minute
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CLEAR_EXPIRED', payload: {} });
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const setBadge = useCallback((itemId: string, badge: NotificationBadge) => {
    dispatch({ type: 'SET_BADGE', payload: { itemId, badge } });
  }, []);

  const removeBadge = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_BADGE', payload: { itemId } });
  }, []);

  const markAsViewed = useCallback((itemId: string) => {
    dispatch({ type: 'MARK_VIEWED', payload: { itemId } });
  }, []);

  const updateBadgeCount = useCallback((itemId: string, count: number) => {
    dispatch({ type: 'UPDATE_BADGE_COUNT', payload: { itemId, count } });
  }, []);

  const setLiveStatus = useCallback((itemId: string, isLive: boolean) => {
    dispatch({ type: 'SET_LIVE_STATUS', payload: { itemId, isLive } });
  }, []);

  const getBadge = useCallback((itemId: string) => {
    return state.badges[itemId];
  }, [state.badges]);

  const isViewed = useCallback((itemId: string) => {
    return state.viewedItems.has(itemId);
  }, [state.viewedItems]);

  const contextValue: NotificationContextType = useMemo(() => ({
    state,
    setBadge,
    removeBadge,
    markAsViewed,
    updateBadgeCount,
    setLiveStatus,
    getBadge,
    isViewed
  }), [state, setBadge, removeBadge, markAsViewed, updateBadgeCount, setLiveStatus, getBadge, isViewed]);
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}