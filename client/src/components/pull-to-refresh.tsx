import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pullThreshold = 80;
  const pullDistance = Math.max(0, currentY - startY);
  const isThresholdMet = pullDistance > pullThreshold;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Find the scroll container (App.tsx has .overflow-y-auto)
    const scrollContainer = document.querySelector('.overflow-y-auto') || scrollRef.current;
    if (scrollContainer && scrollContainer.scrollTop <= 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const y = e.touches[0].clientY;
    const scrollContainer = document.querySelector('.overflow-y-auto') || scrollRef.current;
    
    // Only allow pulling down when at the top
    if (y > startY && scrollContainer && scrollContainer.scrollTop <= 0) {
      if (e.cancelable) e.preventDefault();
      setCurrentY(y);
    } else {
      setIsPulling(false);
      setStartY(0);
      setCurrentY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (isThresholdMet && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed", error);
      } finally {
        setIsRefreshing(false);
        setCurrentY(0);
        setStartY(0);
      }
    } else {
      // Reset if not pulled far enough
      setCurrentY(0);
      setStartY(0);
    }
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: Math.min(1, pullDistance / pullThreshold),
              y: Math.min(pullDistance / 2, pullThreshold / 2)
            }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-50 flex justify-center py-4 pointer-events-none"
          >
            <div className="bg-card/90 backdrop-blur-md shadow-lg border border-border rounded-full p-2 flex items-center justify-center">
              <RefreshCw 
                className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
                style={{ 
                  transform: isRefreshing ? 'none' : `rotate(${Math.min(pullDistance * 2, 180)}deg)` 
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        className="w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isPulling && !isRefreshing ? `translateY(${Math.min(pullDistance / 3, pullThreshold)}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
