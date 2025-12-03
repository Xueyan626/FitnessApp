"use client";

export default function WeeklyPie({ 
  dietCompleted, 
  dietScheduled, 
  exerciseCompleted, 
  exerciseScheduled 
}: { 
  dietCompleted: number; 
  dietScheduled: number; 
  exerciseCompleted: number; 
  exerciseScheduled: number; 
}) {
  // Calculate completion rate percentage, not completion count percentage
  const dietRate = dietScheduled > 0 ? dietCompleted / dietScheduled : 0;
  const exRate = exerciseScheduled > 0 ? exerciseCompleted / exerciseScheduled : 0;
  
  // Calculate the sum of completion rates for displaying the ratio
  const totalRate = dietRate + exRate;
  const dietPct = totalRate > 0 ? dietRate / totalRate : 0;
  const exPct = totalRate > 0 ? exRate / totalRate : 0;

  const size = 120;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dietLen = circumference * dietPct;
  const exLen = circumference * exPct;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="none" stroke="#e5e7eb" strokeWidth={12} />
          <circle
            r={radius}
            fill="none"
            stroke="#f472b6"
            strokeWidth={12}
            strokeDasharray={`${dietLen} ${circumference - dietLen}`}
            transform="rotate(-90)"
          />
          <circle
            r={radius}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={12}
            strokeDasharray={`${exLen} ${circumference - exLen}`}
            strokeDashoffset={-dietLen}
            transform="rotate(-90)"
          />
        </g>
      </svg>
      <div className="text-sm text-gray-700 space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-pink-400"></span>
          Diet: {Math.round(dietRate * 100)}% ({dietCompleted}/{dietScheduled})
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
          Exercise: {Math.round(exRate * 100)}% ({exerciseCompleted}/{exerciseScheduled})
        </div>
        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
          Completion Rate Ratio: Diet {Math.round(dietPct * 100)}% : Exercise {Math.round(exPct * 100)}%
        </div>
      </div>
    </div>
  );
}


