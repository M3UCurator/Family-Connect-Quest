import React, { useState, useEffect, useMemo } from 'react';

interface TimerProps {
  startTime: number;
  duration: number; // in seconds
}

export const Timer: React.FC<TimerProps> = ({ startTime, duration }) => {
  const calculateRemainingTime = useMemo(() => () => {
    if (!startTime) return duration;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, duration - elapsed);
  }, [startTime, duration]);

  const [remainingTime, setRemainingTime] = useState(calculateRemainingTime);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingTime(calculateRemainingTime());
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [calculateRemainingTime]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  
  const isLowTime = remainingTime <= 10 && remainingTime > 0;
  
  let timerColor = 'text-brand-dark';
  if (remainingTime === 0) {
      timerColor = 'text-gray-500';
  } else if (isLowTime) {
      timerColor = 'text-brand-primary';
  }

  const animationClass = isLowTime ? 'animate-pulse' : '';

  return (
    <div className={`text-center mb-4 animate-fade-in`}>
      <div className={`inline-block px-6 py-2 bg-white/80 rounded-full shadow-md ${animationClass}`}>
        <span className={`text-3xl font-black ${timerColor} transition-colors duration-300 tabular-nums`}>
          {remainingTime > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : "Time's Up!"}
        </span>
      </div>
    </div>
  );
};
