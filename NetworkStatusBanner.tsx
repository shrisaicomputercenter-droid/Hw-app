import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../lib/networkStatus';

export const NetworkStatusBanner: React.FC = () => {
  const {
    isDisconnected,
    errorMessage,
    isChecking,
    showReconnectedBadge,
    retry,
  } = useNetworkStatus();

  const [isDismissed, setIsDismissed] = useState(false);

  // If user was reconnected, reset dismissed flag so next offline state will show full banner again
  React.useEffect(() => {
    if (!isDisconnected) {
      setIsDismissed(false);
    }
  }, [isDisconnected]);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-3 pointer-events-none">
      <AnimatePresence>
        {/* State 1: Reconnected Toast */}
        {showReconnectedBadge && !isDisconnected && (
          <motion.div
            key="reconnected"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto bg-emerald-600 text-white rounded-2xl p-3.5 shadow-2xl border border-emerald-400 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700/80 flex items-center justify-center shrink-0 border border-emerald-400">
                <Wifi className="w-4 h-4 text-emerald-100" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  You're Back Online!
                </p>
                <p className="text-[11px] text-emerald-100 leading-tight">
                  Network connection restored. School portal is active.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-700/70 text-emerald-100 px-2 py-1 rounded-full shrink-0">
              Active
            </span>
          </motion.div>
        )}

        {/* State 2: Disconnected Full Banner ("Oops!...") */}
        {isDisconnected && !isDismissed && (
          <motion.div
            key="disconnected-full"
            initial={{ opacity: 0, y: -25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="pointer-events-auto bg-rose-600 text-white rounded-2xl p-4 shadow-2xl border-2 border-rose-400/80 backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-700 flex items-center justify-center shrink-0 border border-rose-400 shadow-inner">
                  <WifiOff className="w-5 h-5 text-rose-100 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black tracking-wide bg-white text-rose-700 px-2 py-0.5 rounded-full uppercase">
                      Offline
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                      Oops! Could Not Catch Network
                    </h4>
                  </div>
                  <p className="text-xs text-rose-100 mt-1 leading-relaxed">
                    {errorMessage ||
                      "Oops! We couldn't catch the network. Please check your Wi-Fi, hotspot, or mobile data and try again."}
                  </p>
                </div>
              </div>

              {/* Close / Minimize to pill */}
              <button
                onClick={() => setIsDismissed(true)}
                title="Minimize banner"
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700/60 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="mt-3.5 pt-2.5 border-t border-rose-500/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Some actions may be unavailable offline
              </span>

              <button
                onClick={retry}
                disabled={isChecking}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 active:scale-95 disabled:opacity-75 transition-all text-xs font-bold rounded-xl shadow-md cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking...' : 'Retry Connection'}
              </button>
            </div>
          </motion.div>
        )}

        {/* State 3: Disconnected Minimized Pill (if user closed full banner) */}
        {isDisconnected && isDismissed && (
          <motion.div
            key="disconnected-minimized"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="pointer-events-auto flex justify-center"
          >
            <button
              onClick={() => setIsDismissed(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg border border-rose-400 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <WifiOff className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
              <span>Oops! No Network (Tap to retry)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
