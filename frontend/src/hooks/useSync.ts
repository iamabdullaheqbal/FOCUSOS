'use client'

import { useEffect } from 'react';
import { SystemEventBus } from '../utils/SystemEventBus';
import type { SystemEventPayload } from '../utils/SystemEventBus';

type SystemEvent = Parameters<typeof SystemEventBus.subscribe>[0];

export interface UseSyncOptions {
  ignoreOrigin?: string;
}

export function useSync(events: SystemEvent | SystemEvent[], callback: (payload: SystemEventPayload) => void, options?: UseSyncOptions) {
  useEffect(() => {
    const eventArray = Array.isArray(events) ? events : [events];
    
    const handler = (payload: SystemEventPayload) => {
      if (options?.ignoreOrigin && payload.origin === options.ignoreOrigin) {
        return;
      }
      callback(payload);
    };

    const unsubscribes = eventArray.map(event => SystemEventBus.subscribe(event, handler));
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [events, callback, options?.ignoreOrigin]);
}
