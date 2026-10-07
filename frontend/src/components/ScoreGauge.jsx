import React from 'react';

const ScoreGauge = ({ score = 300, riskCategory = "Low" }) => {
  // Score range: 300 to 850 (total range 550)
  const minScore = 300;
  const maxScore = 850;
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const percentage = ((clampedScore - minScore) / (maxScore - minScore)) * 100;

  // Determine Tier and Color
  let tierLabel = "POOR";
  let textColor = "text-red-400";
  let bgBadge = "bg-red-500/20 border-red-500/30 text-red-300";
  let strokeColor = "#f87171";

  if (clampedScore >= 740) {
    tierLabel = "EXCELLENT";
    textColor = "text-emerald-400";
    bgBadge = "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
    strokeColor = "#34d399";
  } else if (clampedScore >= 670) {
    tierLabel = "GOOD";
    textColor = "text-indigo-400";
    bgBadge = "bg-indigo-500/20 border-indigo-500/30 text-indigo-300";
    strokeColor = "#818cf8";
  } else if (clampedScore >= 580) {
    tierLabel = "FAIR";
    textColor = "text-amber-400";
    bgBadge = "bg-amber-500/20 border-amber-500/30 text-amber-300";
    strokeColor = "#fbbf24";
  }

  // Semi-circle SVG path calculations
  const radius = 80;
  const circumference = Math.PI * radius; // Half-circle arc
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="relative flex items-center justify-center w-64 h-36">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110">
          <path
            d="M 20,100 A 80,80 0 0,1 180,100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 20,100 A 80,80 0 0,1 180,100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute top-12 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tracking-tight text-white">{clampedScore}</span>
          <span className="text-xs font-semibold text-slate-400 tracking-wider">/ 850</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${bgBadge}`}>
          {tierLabel}
        </span>
        <span className="text-xs text-slate-400 font-medium">
          Predicted Risk: <strong className={textColor}>{riskCategory.toUpperCase()} RISK</strong>
        </span>
      </div>
    </div>
  );
};

export default ScoreGauge;
