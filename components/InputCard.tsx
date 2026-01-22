import React from 'react';

interface InputCardProps {
  label: string;
  description?: string;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  min?: number;
  step?: number;
}

export const InputCard: React.FC<InputCardProps> = ({ 
  label, 
  description, 
  value, 
  onChange, 
  unit, 
  min = 0,
  step = 0.1 
}) => {
  return (
    <div className="flex flex-col gap-1 p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-full text-lg font-bold text-slate-800 bg-transparent focus:outline-none border-b border-dashed border-slate-300 focus:border-blue-500 py-1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
        />
        {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
      </div>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
  );
};