import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, subtitle, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={15} />
        </button>
        <p className="text-[14px] font-bold text-slate-800 pr-8">{title}</p>
        <p className="text-[11px] text-slate-400 mt-1 mb-4">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
