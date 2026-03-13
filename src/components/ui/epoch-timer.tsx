import { Clock, Calendar } from "lucide-react";
import { getTimeToNewEpoch } from "@/utils";

interface EpochTimerProps {
  currentEpoch: number;
  className?: string;
}

const EpochTimer: React.FC<EpochTimerProps> = ({ currentEpoch, className = "" }) => {
  const timeLeft = getTimeToNewEpoch();

  return (
    <div className={`bg-card border-card-border rounded-lg border p-4 shadow-md ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="text-primary h-4 w-4" />
          <span className="text-foreground font-medium">Epoch {currentEpoch.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground">
            Ends in {timeLeft.days} Days {timeLeft.hours} Hours {timeLeft.minutes} Minutes
          </span>
        </div>
      </div>

      <div className="mt-2">
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="from-primary to-accent h-full rounded-full bg-gradient-to-r transition-all duration-300"
            style={{ width: "67%" }} // Mock progress - would be calculated from actual time
          />
        </div>
        <div className="text-muted-foreground mt-1 flex justify-between text-xs">
          <span>Started 17h 37m ago</span>
          <span>67% complete</span>
        </div>
      </div>
    </div>
  );
};

export default EpochTimer;
