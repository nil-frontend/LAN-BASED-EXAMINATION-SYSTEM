
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-gray-900 text-white px-6 py-2 flex justify-between items-center">
      <div className="text-lg font-semibold">
        Exam Nexus
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-500 text-sm font-medium">Connected</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-500 text-sm font-medium">Not Connected</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;
