import React from 'react';
import { AlertCircle } from 'lucide-react';

const EducationalDisclaimer = ({ compact = false }) => {
  return (
    <div className={`rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-sm text-amber-200 text-sm ${compact ? 'py-2 px-3 text-xs' : ''}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className={`text-amber-400 shrink-0 ${compact ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-0.5'}`} />
        <div>
          <span className="font-semibold text-amber-300">Educational Disclaimer: </span>
          <span>
            Credify Score is an estimated score generated using financial information extracted from the uploaded document and an ML-based risk assessment model. It is intended for educational and analytical purposes only and does not represent an official credit bureau rating.
          </span>
        </div>
      </div>
    </div>
  );
};

export default EducationalDisclaimer;
