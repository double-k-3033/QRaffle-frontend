import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: string; // e.g., "6h 23m" or actual timestamp
  className?: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Parse the endTime string (e.g., "6h 23m" or "03h 12m 48s")
      let totalSeconds = 0;

      if (endTime.includes("h") && endTime.includes("m")) {
        // Parse format like "6h 23m" or "03h 12m 48s"
        const hoursMatch = endTime.match(/(\d+)h/);
        const minutesMatch = endTime.match(/(\d+)m/);
        const secondsMatch = endTime.match(/(\d+)s/);

        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;

        totalSeconds = hours * 3600 + minutes * 60 + seconds;
      } else {
        // If it's a timestamp, calculate difference
        const end = new Date(endTime).getTime();
        const now = new Date().getTime();
        totalSeconds = Math.max(0, Math.floor((end - now) / 1000));
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Hours */}
      <div className="rounded-xl bg-gradient-to-b from-blue-400 to-blue-600 px-4 py-3 shadow-lg">
        <div className="text-center text-2xl font-bold text-white">{formatNumber(timeLeft.hours)}</div>
        <div className="mt-1 text-center text-xs text-white">hours</div>
      </div>

      {/* Separator */}
      <div className="flex flex-col space-y-1">
        <div className="h-1 w-1 rounded-full bg-white"></div>
        <div className="h-1 w-1 rounded-full bg-white"></div>
      </div>

      {/* Minutes */}
      <div className="rounded-xl bg-gradient-to-b from-blue-400 to-blue-600 px-4 py-3 shadow-lg">
        <div className="text-center text-2xl font-bold text-white">{formatNumber(timeLeft.minutes)}</div>
        <div className="mt-1 text-center text-xs text-white">minutes</div>
      </div>

      {/* Separator */}
      <div className="flex flex-col space-y-1">
        <div className="h-1 w-1 rounded-full bg-white"></div>
        <div className="h-1 w-1 rounded-full bg-white"></div>
      </div>

      {/* Seconds */}
      <div className="rounded-xl bg-gradient-to-b from-blue-400 to-blue-600 px-4 py-3 shadow-lg">
        <div className="text-center text-2xl font-bold text-white">{formatNumber(timeLeft.seconds)}</div>
        <div className="mt-1 text-center text-xs text-white">seconds</div>
      </div>
    </div>
  );
};

export default CountdownTimer;
