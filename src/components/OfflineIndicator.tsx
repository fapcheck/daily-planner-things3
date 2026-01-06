import { useEffect, useState } from "react";
import { WifiOff, Wifi, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfflineSync } from "@/hooks/useOfflineSync";

interface OfflineIndicatorProps {
  onSyncRequested?: () => void;
}

export function OfflineIndicator({ onSyncRequested }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { getPendingCount } = useOfflineSync();

  // Fetch pending count on mount and when online status changes
  useEffect(() => {
    const fetchPendingCount = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };
    fetchPendingCount();
  }, [getPendingCount, isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Trigger sync when back online
      onSyncRequested?.();
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onSyncRequested]);

  // Show pending changes indicator when online
  if (isOnline && !showReconnected && pendingCount > 0) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium bg-amber-500 text-white">
        <CloudOff className="h-4 w-4" />
        <span>{pendingCount} pending change{pendingCount > 1 ? 's' : ''}</span>
      </div>
    );
  }

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online - syncing...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You're offline{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}</span>
        </>
      )}
    </div>
  );
}
