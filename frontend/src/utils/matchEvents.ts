// Match event system for unified CRUD notifications across components
import { useEffect } from 'react';

type MatchEventCallback = () => void;

class MatchEventBus {
  private listeners: Set<MatchEventCallback> = new Set();

  // Subscribe to match updates
  subscribe(callback: MatchEventCallback): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Emit match update event - call this after any CRUD operation
  emit(): void {
    console.log('[MatchEvents] Emitting match update event to', this.listeners.size, 'listeners');
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error('[MatchEvents] Error in listener:', err);
      }
    });
  }
}

// Singleton instance
export const matchEvents = new MatchEventBus();

// Helper hook for React components
export function useMatchEvents(onUpdate: MatchEventCallback): void {
  useEffect(() => {
    const unsubscribe = matchEvents.subscribe(onUpdate);
    return unsubscribe;
  }, [onUpdate]);
}
