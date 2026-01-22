import React from 'react';

interface ResultMetricProps {
  label: string;
  value: number | string;
  unit?: string;
  icon?: React.ReactNode;
  colorClass?: string;
  benchmark?: string;
}

export const ResultMetric: React.FC<ResultMetricProps> = ({ 
  label, 
  value, 
  unit, 
  icon, 
  colorClass = "bg-blue-50 text-blue-700",
  benchmark
}) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md p-6 border border-slate-100 relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${colorClass.replace('bg-', 'text-')}`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-500 mb-2">{label}</span>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className={`text-4xl font-extrabold ${colorClass.split(' ')[1]}`}>{value}</span>
        {unit && <span className="text-lg font-medium text-slate-400">{unit}</span>}
      </div>
      {benchmark && (
        <div className="mt-3 pt-3 border-t border-slate-100">
           <p className="text-xs text-slate-400">
             <span className="font-semibold text-slate-500">Бенчмарк:</span> {benchmark}
           </p>
        </div>
      )}
    </div>
  );
};