import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export default function Field({ label, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
