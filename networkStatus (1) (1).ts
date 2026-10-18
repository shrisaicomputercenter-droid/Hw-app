import { useState, useEffect, useCallback } from 'react';

type NetworkListener = (status: NetworkStatus) => void;

export interface NetworkStatus {
  isOnline: boolean;
  hasNetworkError: boolean;
  errorMessage: string | null;
  lastChecked: number;
}

let currentStatus: NetworkStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  hasNetworkError: false,
  errorMessage: null,
  lastChecked: Date.now(),
};

const listeners = new Set<NetworkListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener({ ...currentStatus });
    } catch (e) {
      console.error('Error in network listener:', e);
    }
  });
}

export const networkStatusTracker = {
  getStatus(): NetworkStatus {
    return { ...currentStatus };
  },

  subscribe(listener: NetworkListener): () => void {
    listeners.add(listener);
    // Provide immediate current state
    listener({ ...currentStatus });
    return () => {
      listeners.delete(listener);
    };
  },

  reportNetworkFailure(reason?: string) {
    const message =
      reason ||
      "Oops! We couldn't catch the network. Please check your internet connection.";
    currentStatus = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
      hasNetworkError: true,
      errorMessage: message,
      lastChecked: Date.now(),
    };
    notifyListeners();
  },

  reportNetworkSuccess() {
    if (!currentStatus.isOnline || currentStatus.hasNetworkError) {
      currentStatus = {
        isOnline: true,
        hasNetworkError: false,
        errorMessage: null,
        lastChecked: Date.now(),
      };
      notifyListeners();
    }
  },

  async checkConnectivity(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      currentStatus = {
        isOnline: false,
        hasNetworkError: true,
        errorMessage:
          "Oops! Your device is offline. Please check your Wi-Fi or mobile data.",
        lastChecked: Date.now(),
      };
      notifyListeners();
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`/api/health?_t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        currentStatus = {
          isOnline: true,
          hasNetworkError: false,
          errorMessage: null,
          lastChecked: Date.now(),
        };
        notifyListeners();
        return true;
      } else {
        currentStatus = {
          isOnline: true,
          hasNetworkError: true,
          errorMessage: "Oops! Server responded with an error. Retrying...",
          lastChecked: Date.now(),
        };
        notifyListeners();
        return false;
      }
    } catch (err: any) {
      currentStatus = {
        isOnline: false,
        hasNetworkError: true,
        errorMessage:
          "Oops! Could not catch network. Please check your internet connection.",
        lastChecked: Date.now(),
      };
      notifyListeners();
      return false;
    }
  },
};

// Global browser listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // When browser fires online event, verify with a quick ping
    networkStatusTracker.checkConnectivity();
  });

  window.addEventListener('offline', () => {
    networkStatusTracker.reportNetworkFailure(
      "Oops! You are offline. Network connection was lost."
    );
  });
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(() =>
    networkStatusTracker.getStatus()
  );
  const [isChecking, setIsChecking] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnectedBadge, setShowReconnectedBadge] = useState(false);

  useEffect(() => {
    const unsubscribe = networkStatusTracker.subscribe((newStatus) => {
      setStatus(newStatus);
      const isDown = !newStatus.isOnline || newStatus.hasNetworkError;

      if (isDown) {
        setWasOffline(true);
        setShowReconnectedBadge(false);
      } else if (wasOffline && !isDown) {
        // Just came back online!
        setShowReconnectedBadge(true);
        const timer = setTimeout(() => {
          setShowReconnectedBadge(false);
          setWasOffline(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [wasOffline]);

  const retry = useCallback(async () => {
    setIsChecking(true);
    try {
      await networkStatusTracker.checkConnectivity();
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isOnline: status.isOnline,
    hasNetworkError: status.hasNetworkError,
    isDisconnected: !status.isOnline || status.hasNetworkError,
    errorMessage: status.errorMessage,
    lastChecked: status.lastChecked,
    isChecking,
    showReconnectedBadge,
    retry,
  };
}
